"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface CampaignFormProps {
  onSuccess?: (campaignId: string) => void;
}

export function CampaignForm({ onSuccess }: CampaignFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Campaign created successfully!");
        setName("");
        setDescription("");
        if (onSuccess) {
          onSuccess(data.campaignId);
        }
      } else {
        toast.error("Failed to create campaign", {
          description: data.error || "Please try again",
        });
      }
    } catch (err) {
      toast.error("Network error", {
        description: "Please check your connection and try again",
      });
      console.error("Error creating campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">
              Campaign Name <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Campaign"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">
              Description (Optional)
            </FieldLabel>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campaign description..."
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </Field>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
