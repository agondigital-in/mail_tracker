"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Mail, Plus, Repeat, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  subject: z.string().min(1, "Email subject is required"),
  htmlContent: z.string().min(1, "Email content is required"),
  selectedLists: z
    .array(z.string())
    .min(1, "Select at least one recipient list"),
  smtpConfigs: z
    .array(
      z.object({
        serverId: z.string().min(1, "SMTP server is required"),
        limit: z.number().min(1, "Limit must be at least 1"),
      }),
    )
    .min(1, "Add at least one SMTP server"),
  scheduleType: z.enum(["immediate", "scheduled", "recurring"]),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  delay: z.number().min(0),
  sortOrder: z.enum(["newest", "oldest"]),
});

type FormValues = z.infer<typeof formSchema>;

interface RecipientList {
  _id: string;
  name: string;
}

interface SmtpServer {
  _id: string;
  name: string;
}

export default function BulkComposePage() {
  const router = useRouter();
  const [recipientLists, setRecipientLists] = useState<RecipientList[]>([]);
  const [smtpServers, setSmtpServers] = useState<SmtpServer[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      htmlContent: "",
      selectedLists: [],
      smtpConfigs: [],
      scheduleType: "immediate" as const,
      scheduledDate: "",
      scheduledTime: "09:00",
      frequency: "daily" as const,
      delay: 2,
      sortOrder: "newest" as const,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "smtpConfigs",
  });

  useEffect(() => {
    fetch("/api/recipient-lists/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRecipientLists(data.lists || []);
      })
      .catch(() => setRecipientLists([]));

    fetch("/api/smtp-servers/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSmtpServers(data.smtpServers || []);
      })
      .catch(() => setSmtpServers([]));
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const scheduleData: {
        type: string;
        startDate?: string;
        frequency?: string;
        sortOrder?: string;
      } = {
        type: values.scheduleType,
        sortOrder: values.sortOrder,
      };

      if (values.scheduleType === "scheduled" && values.scheduledDate) {
        scheduleData.startDate = new Date(
          `${values.scheduledDate}T${values.scheduledTime}`,
        ).toISOString();
      }

      if (values.scheduleType === "recurring") {
        scheduleData.startDate = new Date(
          `${values.scheduledDate || new Date().toISOString().split("T")[0]}T${values.scheduledTime}`,
        ).toISOString();
        scheduleData.frequency = values.frequency;
      }

      const response = await fetch("/api/campaigns/bulk/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          subject: values.subject,
          htmlContent: values.htmlContent,
          recipientListIds: values.selectedLists,
          mailServers: values.smtpConfigs,
          schedule: scheduleData,
          delay: values.delay,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Campaign created successfully!");
        router.push(`/dashboard/campaigns/${data.campaignId}/monitor`);
      } else {
        toast.error(data.error || "Failed to create campaign");
      }
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Advanced Bulk Campaign
          </h1>
        </div>
        <p className="text-muted-foreground text-lg ml-15">
          Create campaigns with recipient lists, multiple SMTP servers, and
          scheduling
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Name</FormLabel>
                <FormControl>
                  <Input placeholder="Summer Sale Campaign" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Subject</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Hello {{name}}! Special offer for you"
                    {...field}
                  />
                </FormControl>
                {field.value && (
                  <div className="mt-2 p-3 rounded-md bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">
                      Preview:
                    </p>
                    <p className="text-sm font-medium">
                      {field.value
                        .replace(/\{\{name\}\}/gi, "John Doe")
                        .replace(/\{\{email\}\}/gi, "john@example.com")}
                    </p>
                  </div>
                )}
                <FormDescription>
                  Use {"{{name}}"} and {"{{email}}"} for personalization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="htmlContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Content (HTML)</FormLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <FormControl>
                      <Textarea
                        placeholder="<h1>Hi {{name}}</h1><p>Your email: {{email}}</p>"
                        className="font-mono min-h-[300px] max-h-[400px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="mt-2">
                      HTML Editor - Use {"{{name}}"} and {"{{email}}"} for
                      personalization
                    </FormDescription>
                  </div>
                  <div className="flex flex-col">
                    <div className="border rounded-md bg-white flex-1 min-h-[300px] max-h-[400px] overflow-hidden flex flex-col">
                      <p className="text-xs text-muted-foreground p-3 border-b bg-muted/50">
                        Live Preview:
                      </p>
                      <div className="flex-1 overflow-auto">
                        <iframe
                          srcDoc={field.value
                            .replace(/\{\{name\}\}/gi, "John Doe")
                            .replace(/\{\{email\}\}/gi, "john@example.com")}
                          className="w-full h-full border-0"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selectedLists"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Lists</FormLabel>
                <Select
                  onValueChange={(value) => {
                    if (!field.value.includes(value)) {
                      field.onChange([...field.value, value]);
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient lists" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {recipientLists && recipientLists.length > 0 ? (
                      recipientLists.map((list) => (
                        <SelectItem key={list._id} value={list._id}>
                          {list.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No recipient lists found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((listId) => {
                      const list = recipientLists.find((l) => l._id === listId);
                      return (
                        <div
                          key={listId}
                          className="bg-muted px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {list?.name}
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(
                                field.value.filter((id) => id !== listId),
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <FormLabel>SMTP Servers</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => append({ serverId: "", limit: 100 })}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Server
                </Button>
              </div>
              <FormDescription>
                Set how many emails each server can send per execution
              </FormDescription>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`smtpConfigs.${index}.serverId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">SMTP Server</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select server" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {smtpServers.map((server) => (
                              <SelectItem key={server._id} value={server._id}>
                                {server.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`smtpConfigs.${index}.limit`}
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <FormLabel className="text-xs">
                          Limit (per execution)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Click "Add Server" to configure SMTP servers
                </p>
              )}
            </div>
          </div>

          <FormField
            control={form.control}
            name="scheduleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Type</FormLabel>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    type="button"
                    variant={
                      field.value === "immediate" ? "default" : "outline"
                    }
                    onClick={() => field.onChange("immediate")}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Immediate
                  </Button>
                  <Button
                    type="button"
                    variant={
                      field.value === "scheduled" ? "default" : "outline"
                    }
                    onClick={() => field.onChange("scheduled")}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Scheduled
                  </Button>
                  <Button
                    type="button"
                    variant={
                      field.value === "recurring" ? "default" : "outline"
                    }
                    onClick={() => field.onChange("recurring")}
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    Recurring
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("scheduleType") === "scheduled" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {form.watch("scheduleType") === "recurring" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          <FormField
            control={form.control}
            name="delay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delay Between Emails (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Delay to avoid rate limiting</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Processing Order</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="newest">
                      Newest First (Recently added recipients get priority)
                    </SelectItem>
                    <SelectItem value="oldest">
                      Oldest First (Original recipients get priority)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which recipients to process first. Useful when adding
                  new recipients during campaign.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full"
            size="lg"
          >
            {form.formState.isSubmitting
              ? "Creating Campaign..."
              : "Create Campaign"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-3">💡 Template Variables</h3>
        <p className="text-sm text-muted-foreground">
          Use{" "}
          <code className="bg-background px-2 py-1 rounded">{"{{name}}"}</code>{" "}
          and{" "}
          <code className="bg-background px-2 py-1 rounded">{"{{email}}"}</code>{" "}
          in your subject and content to personalize emails.
        </p>
      </div>
    </div>
  );
}
