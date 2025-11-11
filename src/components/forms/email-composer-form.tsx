"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
            <select
              id="campaign"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">No campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign._id} value={campaign._id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="html">
              Email Content (HTML) <span className="text-red-500">*</span>
            </FieldLabel>
            <textarea
              id="html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Your email HTML content here..."
              required
              rows={10}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
            />
          </Field>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
