"use client";

import { AlertCircle, CheckCircle, Database, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MigrationStatus {
  totalRecipients: number;
  recipientsWithCampaigns: number;
  recipientsWithoutCampaigns: number;
  migrationNeeded: boolean;
  totalEmailsToProcess: number;
}

interface MigrationResult {
  emailsProcessed: number;
  recipientsUpdated: number;
  failed: number;
  totalRecipients: number;
}

export default function MigrationPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/migrate-recipients");
      const data = await response.json();

      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || "Failed to fetch status");
      }
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const runMigration = async () => {
    if (!confirm("Are you sure you want to run the migration?")) {
      return;
    }

    try {
      setMigrating(true);
      setError("");
      setResult(null);

      const response = await fetch("/api/admin/migrate-recipients", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.stats);
        await fetchStatus();
      } else {
        setError(data.error || "Migration failed");
      }
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Loading migration status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Recipient Migration
        </h1>
        <p className="text-muted-foreground text-lg">
          Populate sentCampaigns array in recipient documents
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Migration Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-700">Emails Processed</p>
                <p className="text-2xl font-bold text-green-900">
                  {result.emailsProcessed}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Recipients Updated</p>
                <p className="text-2xl font-bold text-green-900">
                  {result.recipientsUpdated}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">Total Recipients</p>
                <p className="text-3xl font-bold text-blue-900">
                  {status.totalRecipients}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">With Campaigns</p>
                <p className="text-3xl font-bold text-green-900">
                  {status.recipientsWithCampaigns}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={runMigration}
                disabled={migrating || !status.migrationNeeded}
                className="gap-2"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Run Migration
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={fetchStatus}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

