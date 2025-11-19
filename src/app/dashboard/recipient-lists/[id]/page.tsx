"use client";

import { ArrowLeft, Trash2, Upload, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecipientListDetailPage() {
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/recipient-lists/${listId}`);
      const data = await response.json();
      if (data.success) {
        setList(data.list);
        setRecipients(data.recipients);
        setStats(data.stats);
      }
    } catch (_error) {
      toast.error("Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("listId", listId); // ✅ Add listId to formData

    try {
      const response = await fetch("/api/recipients/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Uploaded successfully! Added: ${data.added}, Skipped: ${data.skipped}`,
        );
        setIsUploadOpen(false);
        setFile(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to upload");
      }
    } catch (_error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const response = await fetch("/api/recipients/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId,
          email,
          name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Recipient added successfully");
        setIsAddOpen(false);
        setEmail("");
        setName("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to add recipient");
      }
    } catch (_error) {
      toast.error("Failed to add recipient");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRecipient = async (recipientId: string) => {
    if (!confirm("Are you sure you want to remove this recipient?")) return;

    try {
      const response = await fetch(`/api/recipients/${recipientId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Recipient removed");
        fetchData();
      } else {
        toast.error(data.error || "Failed to remove recipient");
      }
    } catch (_error) {
      toast.error("Failed to remove recipient");
    }
  };

  if (loading)
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  if (!list)
    return <div className="container mx-auto py-8 px-4">List not found</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Link href="/dashboard/recipient-lists">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lists
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">{list.name}</h1>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Recipient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRecipient} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <Button type="submit" disabled={adding} className="w-full">
                  {adding ? "Adding..." : "Add Recipient"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV/Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Recipients</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">File (CSV or Excel)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    File should have columns: email, name (optional)
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full"
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Unsubscribed</p>
          <p className="text-3xl font-bold text-red-600">
            {stats.unsubscribed}
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-8 text-muted-foreground"
                >
                  No recipients yet. Click "Upload CSV/Excel" or "Add Recipient"
                  to get started.
                </td>
              </tr>
            ) : (
              recipients.map((recipient) => (
                <tr key={recipient._id} className="border-b hover:bg-muted/50">
                  <td className="p-4">{recipient.email}</td>
                  <td className="p-4">{recipient.name || "-"}</td>
                  <td className="p-4">
                    {recipient.unsubscribed ? (
                      <span className="text-red-600 text-sm">Unsubscribed</span>
                    ) : (
                      <span className="text-green-600 text-sm">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecipient(recipient._id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
