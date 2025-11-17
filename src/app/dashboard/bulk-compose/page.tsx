"use client";

import { Mail } from "lucide-react";
import { BulkEmailForm } from "@/components/compose/bulk-email-form";

export default function BulkComposePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Bulk Email Compose
          </h1>
        </div>
        <p className="text-muted-foreground text-lg ml-15">
          Send personalized emails to multiple recipients from Excel
        </p>
      </div>

      <BulkEmailForm />

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-3">📋 Excel Format Instructions</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Your Excel file should have the following columns:</p>
          <div className="bg-background p-3 rounded border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pt-2">John Doe</td>
                  <td className="pt-2">john@example.com</td>
                </tr>
                <tr>
                  <td className="pt-1">Jane Smith</td>
                  <td className="pt-1">jane@example.com</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            💡 <strong>Tip:</strong> Use{" "}
            <code className="bg-background px-2 py-1 rounded">
              {"{{name}}"}
            </code>{" "}
            in your subject and body to personalize emails for each recipient.
          </p>
        </div>
      </div>
    </div>
  );
}
