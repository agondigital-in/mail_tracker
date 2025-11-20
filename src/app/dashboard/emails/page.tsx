"use client";

import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MailOpen,
  MailX,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Email {
  _id: string;
  to: string;
  from: string;
  subject: string;
  sentAt: string;
  uniqueOpens: number;
  uniqueClicks: number;
  bounced: boolean;
  status: string;
  smtpServerId?: { _id: string; name: string };
  campaignId?: { _id: string; name: string };
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEmails = useCallback((pageNum: number) => {
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
  }, []);

  useEffect(() => {
    fetchEmails(page);
  }, [page, fetchEmails]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">All Emails</h1>
        </div>
        <p className="text-muted-foreground text-lg ml-15">
          View all sent emails and their tracking data
        </p>
      </div>

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Sent Emails ({emails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <p className="text-muted-foreground mb-4 text-lg">
                No emails sent yet
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link href="/dashboard/compose">
                  <Mail className="w-4 h-4" />
                  Send Your First Email
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email._id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-lg">{email.subject}</p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              email.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : email.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {email.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3" />
                          To: {email.to}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          From: {email.from}
                        </p>
                        {email.smtpServerId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Server: {email.smtpServerId.name} (
                            {email.smtpServerId._id})
                          </p>
                        )}
                        {email.campaignId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Campaign: {email.campaignId.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(email.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-4 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MailOpen className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            {email.uniqueOpens}
                          </span>
                          <span className="text-muted-foreground">opens</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MousePointerClick className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">
                            {email.uniqueClicks}
                          </span>
                          <span className="text-muted-foreground">clicks</span>
                        </div>
                        {email.bounced && (
                          <div className="flex items-center gap-1">
                            <MailX className="w-4 h-4 text-red-600" />
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                              Bounced
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                    >
                      <Link href={`/dashboard/emails/${email._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
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
