"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
}

export function EmailComposerForm() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/campaigns/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCampaigns(data.campaigns);
        }
      })
      .catch((err) => console.error("Error fetching campaigns:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html,
          campaignId: campaignId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email sent successfully!", {
          description: `Tracking ID: ${data.trackingId}`,
        });
        setTo("");
        setSubject("");
        setHtml("");
        setCampaignId("");
        router.push(`/dashboard/emails/${data.emailId}`);
      } else {
        toast.error("Failed to send email", {
          description: data.error || "Please try again",
        });
      }
    } catch (err) {
      toast.error("Network error", {
        description: "Please check your connection and try again",
      });
      console.error("Error sending email:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="to">
              Recipient Email <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="campaign">Campaign (Optional)</FieldLabel>
            <div className="flex gap-2">
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="No campaign selected" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign._id} value={campaign._id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CreateCampaignDialog
                onSuccess={(campaignId) => {
                  fetch("/api/campaigns/list")
                    .then((res) => res.json())
                    .then((data) => {
                      if (data.success) {
                        setCampaigns(data.campaigns);
                        setCampaignId(campaignId);
                      }
                    });
                }}
                trigger={
                  <Button type="button" variant="outline" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                }
              />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="html">
              Email Content (HTML) <span className="text-red-500">*</span>
            </FieldLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <textarea
                  id="html"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="Your email HTML content here..."
                  required
                  className="flex-1 min-h-[300px] max-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-y"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  HTML Editor
                </p>
              </div>
              <div className="flex flex-col">
                <iframe
                  srcDoc={html}
                  className="flex-1 min-h-[300px] max-h-[400px] w-full rounded-md border border-input bg-white"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Live Preview
                </p>
              </div>
            </div>
          </Field>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
