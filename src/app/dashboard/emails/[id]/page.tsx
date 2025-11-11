"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EmailMetadata } from "@/components/email/email-metadata";
import { EventsList } from "@/components/email/events-list";
import { Button } from "@/components/ui/button";

interface EmailData {
  email: any;
  opens: any[];
  clicks: any[];
  bounce: any;
}

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params.id as string;

    fetch(`/api/emails/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to load email");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching email:", err);
        setError("Network error");
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Email not found"}</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
        <h1 className="text-3xl font-bold">Email Details</h1>
        <p className="text-muted-foreground mt-2">
          View tracking data and engagement metrics
        </p>
      </div>

      <div className="space-y-6">
        <EmailMetadata email={data.email} />
        <EventsList
          opens={data.opens}
          clicks={data.clicks}
          bounce={data.bounce}
        />
      </div>
    </div>
  );
}
