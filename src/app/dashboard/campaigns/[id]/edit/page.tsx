"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SmtpConfig {
  serverId: string;
  limit: number;
  sent?: number;
}

interface SmtpServer {
  _id: string;
  name: string;
}

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [delay, setDelay] = useState(0);
  const [campaignStatus, setCampaignStatus] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [availableServers, setAvailableServers] = useState<SmtpServer[]>([]);

  useEffect(() => {
    const id = params.id as string;

    // Fetch campaign data
    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setName(result.campaign.name || "");
          setDescription(result.campaign.description || "");
          setSubject(result.campaign.subject || "");
          setHtmlContent(result.campaign.htmlContent || "");
          setDelay(result.campaign.delay || 0);
          setCampaignStatus(result.campaign.status || "");
          setCampaignType(result.campaign.type || "");
          setSmtpConfigs(result.campaign.mailServers || []);
        } else {
          alert(result.error || "Failed to load campaign");
          router.push("/dashboard/campaigns");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching campaign:", err);
        alert("Network error");
        router.push("/dashboard/campaigns");
      });

    // Fetch available SMTP servers
    fetch("/api/smtp-servers/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAvailableServers(data.smtpServers || []);
        }
      })
      .catch(() => setAvailableServers([]));
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Campaign name is required");
      return;
    }

    if (campaignType === "bulk" && !subject.trim()) {
      alert("Email subject is required");
      return;
    }

    if (campaignType === "bulk" && !htmlContent.trim()) {
      alert("Email content is required");
      return;
    }

    // Validate SMTP configs for bulk campaigns
    if (campaignType === "bulk" && smtpConfigs.length === 0) {
      alert("Add at least one SMTP server");
      return;
    }

    if (campaignType === "bulk") {
      for (const config of smtpConfigs) {
        if (!config.serverId) {
          alert("Please select SMTP server for all entries");
          return;
        }
        if (config.limit < 1) {
          alert("SMTP server limit must be at least 1");
          return;
        }
      }
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          subject: subject.trim(),
          htmlContent: htmlContent.trim(),
          delay: delay,
          mailServers: smtpConfigs,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Campaign updated successfully");
        router.push(`/dashboard/campaigns/${params.id}`);
      } else {
        alert(result.error || "Failed to update campaign");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (campaignStatus === "processing") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Cannot edit campaign while processing
            </p>
            <Button asChild>
              <Link href={`/dashboard/campaigns/${params.id}`}>
                Back to Campaign
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button asChild variant="outline" className="mb-4 gap-2">
        <Link href={`/dashboard/campaigns/${params.id}`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Campaign
        </Link>
      </Button>

      {campaignType === "bulk" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ What can be edited?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Campaign name and description</li>
            <li>✅ Email subject and content (HTML)</li>
            <li>✅ SMTP servers and their limits</li>
            <li>✅ Delay between emails</li>
            <li>❌ Recipients and schedule (cannot be changed)</li>
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter campaign description (optional)"
                rows={3}
              />
            </div>

            {campaignType === "bulk" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Hello {{name}}! Special offer for you"
                    required
                  />
                  {subject && (
                    <div className="mt-2 p-3 rounded-md bg-muted/50 border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Preview:
                      </p>
                      <p className="text-sm font-medium">
                        {subject
                          .replace(/\{\{name\}\}/gi, "John Doe")
                          .replace(/\{\{email\}\}/gi, "john@example.com")}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Use {"{{name}}"} and {"{{email}}"} for personalization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="htmlContent">Email Content (HTML) *</Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <Textarea
                        id="htmlContent"
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        placeholder="<h1>Hi {{name}}</h1><p>Your email: {{email}}</p>"
                        className="font-mono h-[200px] resize-y"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        HTML Editor - Use {"{{name}}"} and {"{{email}}"} for
                        personalization
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="border rounded-md bg-white h-[200px] overflow-hidden flex flex-col">
                        <p className="text-xs text-muted-foreground p-2 border-b bg-muted/50">
                          Live Preview:
                        </p>
                        <div className="flex-1 overflow-auto">
                          <iframe
                            srcDoc={htmlContent
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
                </div>

                <div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <Label>SMTP Servers *</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setSmtpConfigs([
                            ...smtpConfigs,
                            { serverId: "", limit: 100 },
                          ])
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Server
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set how many emails each server can send per execution
                    </p>
                  </div>
                  {smtpConfigs.some((c) => c.sent && c.sent > 0) && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Note: "Sent" counts are preserved and cannot be
                        modified. You can update limits or add/remove servers.
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {smtpConfigs.map((config, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">SMTP Server</Label>
                          <Select
                            value={config.serverId}
                            onValueChange={(value) => {
                              const newConfigs = [...smtpConfigs];
                              newConfigs[index].serverId = value;
                              setSmtpConfigs(newConfigs);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select server" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableServers.map((server) => (
                                <SelectItem key={server._id} value={server._id}>
                                  {server.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-40">
                          <Label className="text-xs">
                            Limit (per execution)
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="100"
                            value={config.limit}
                            onChange={(e) => {
                              const newConfigs = [...smtpConfigs];
                              newConfigs[index].limit = Number(e.target.value);
                              setSmtpConfigs(newConfigs);
                            }}
                          />
                        </div>
                        {config.sent !== undefined && config.sent > 0 && (
                          <div className="w-32">
                            <Label className="text-xs">Sent</Label>
                            <Input
                              type="number"
                              value={config.sent}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newConfigs = smtpConfigs.filter(
                              (_, i) => i !== index,
                            );
                            setSmtpConfigs(newConfigs);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {smtpConfigs.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Click "Add Server" to configure SMTP servers
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delay">Delay Between Emails (seconds)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min={0}
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Delay to avoid rate limiting
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
