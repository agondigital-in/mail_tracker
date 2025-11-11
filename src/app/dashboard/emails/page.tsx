"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Email {
  _id: string;
  to: string;
  subject: string;
  sentAt: string;
  uniqueOpens: number;
  uniqueClicks: number;
  bounced: boolean;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmails = (pageNum: number) => {
    setLoading(true);
    fetch(`/api/emails/list?page=${pageNum}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmails(data.emails);
          setTotalPages(data.totalPages);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching emails:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmails(page);
  }, [page]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Emails</h1>
        <p className="text-muted-foreground mt-2">
          View all sent emails and their tracking data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sent Emails ({emails.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No emails sent yet</p>
              <Button asChild>
                <Link href="/dashboard/compose">Send Your First Email</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {emails.map((email) => (
                  <div
                    key={email._id}
                    className="border rounded-md p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          To: {email.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm">
                          <span className="font-medium">
                            {email.uniqueOpens}
                          </span>{" "}
                          opens
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {email.uniqueClicks}
                          </span>{" "}
                          clicks
                        </div>
                        {email.bounced && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Bounced
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Link href={`/dashboard/emails/${email._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
