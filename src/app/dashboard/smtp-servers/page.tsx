"use client";

import { Edit, Plus, Server, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddSmtpServerDialog } from "@/components/smtp/add-smtp-server-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SmtpServer {
  _id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  isDefault: boolean;
}

export default function SmtpServersPage() {
  const [smtpServers, setSmtpServers] = useState<SmtpServer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSmtpServers = useCallback(async () => {
    try {
      const response = await fetch("/api/smtp-servers/list");
      const data = await response.json();
      if (data.success) {
        setSmtpServers(data.smtpServers);
      }
    } catch (error) {
      console.error("Error fetching SMTP servers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmtpServers();
  }, [fetchSmtpServers]);

  const handleDelete = async (smtpServerId: string) => {
    if (!confirm("Are you sure you want to delete this SMTP server?")) {
      return;
    }

    try {
      const response = await fetch("/api/smtp-servers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpServerId }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("SMTP server deleted successfully");
        fetchSmtpServers();
      } else {
        toast.error("Failed to delete SMTP server");
      }
    } catch (error) {
      toast.error("Error deleting SMTP server");
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">SMTP Servers</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-15">
            Manage your email sending servers
          </p>
        </div>
        <AddSmtpServerDialog onSuccess={fetchSmtpServers} />
      </div>

      {smtpServers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No SMTP Servers</h3>
            <p className="text-muted-foreground mb-4">
              Add your first SMTP server to start sending emails
            </p>
            <AddSmtpServerDialog
              onSuccess={fetchSmtpServers}
              trigger={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add SMTP Server
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {smtpServers.map((server) => (
            <Card key={server._id} className="relative">
              {server.isDefault && (
                <div className="absolute top-2 right-2">
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Default
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  {server.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Host:</span>{" "}
                    <span className="font-mono">
                      {server.host}:{server.port}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">From:</span>{" "}
                    <span>
                      {server.fromName} &lt;{server.fromEmail}&gt;
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <AddSmtpServerDialog
                    editData={server}
                    onSuccess={fetchSmtpServers}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    }
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(server._id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
