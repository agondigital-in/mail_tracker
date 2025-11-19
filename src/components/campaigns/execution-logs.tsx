"use client";

import { CheckCircle2, Clock, Mail, Server, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutionLog {
  executedAt: string;
  status: "success" | "partial" | "failed";
  sentCount: number;
  failedCount: number;
  duration: number;
  smtpStats: Array<{
    serverId: string;
    serverName: string;
    sent: number;
    failed: number;
  }>;
  error?: string;
}

interface ExecutionLogsProps {
  campaignId: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-green-600 bg-green-50 border-green-200";
    case "partial":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "failed":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "partial":
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Clock className="w-5 h-5 text-gray-600" />;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString();
}

export function ExecutionLogs({ campaignId }: ExecutionLogsProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/logs`);
        const data = await response.json();

        if (data.success) {
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // Refresh logs every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [campaignId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading execution logs...</p>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Execution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No executions yet. Campaign will start at scheduled time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Execution History ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(log.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-semibold capitalize">{log.status}</p>
                    <p className="text-xs opacity-75">
                      {getRelativeTime(log.executedAt)} •{" "}
                      {new Date(log.executedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    Duration: {formatDuration(log.duration)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <div>
                    <p className="text-xs opacity-75">Sent</p>
                    <p className="font-bold">{log.sentCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <div>
                    <p className="text-xs opacity-75">Failed</p>
                    <p className="font-bold">{log.failedCount}</p>
                  </div>
                </div>
              </div>

              {log.smtpStats && log.smtpStats.length > 0 && (
                <div className="border-t pt-3 mt-3 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    SMTP Server Stats:
                  </p>
                  {log.smtpStats.map((smtp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-white/50 rounded px-2 py-1"
                    >
                      <span className="font-medium">{smtp.serverName}</span>
                      <span>
                        {smtp.sent} sent
                        {smtp.failed > 0 && ` • ${smtp.failed} failed`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {log.error && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-semibold mb-1">Error:</p>
                  <p className="text-xs opacity-75">{log.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
