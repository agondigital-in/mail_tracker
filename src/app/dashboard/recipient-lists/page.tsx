"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Trash2, Eye } from "lucide-react";
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
import { toast } from "sonner";
import Link from "next/link";

interface RecipientList {
	_id: string;
	name: string;
	description?: string;
	createdAt: string;
}

export default function RecipientListsPage() {
	const [lists, setLists] = useState<RecipientList[]>([]);
	const [loading, setLoading] = useState(true);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		fetchLists();
	}, []);

	const fetchLists = async () => {
		try {
			const response = await fetch("/api/recipient-lists/list");
			const data = await response.json();
			if (data.success) {
				setLists(data.lists);
			}
		} catch (error) {
			toast.error("Failed to load recipient lists");
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setCreating(true);

		try {
			const response = await fetch("/api/recipient-lists/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, description }),
			});

			const data = await response.json();

			if (data.success) {
				toast.success("Recipient list created successfully");
				setIsCreateOpen(false);
				setName("");
				setDescription("");
				fetchLists();
			} else {
				toast.error(data.error || "Failed to create list");
			}
		} catch (error) {
			toast.error("Failed to create list");
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure? This will delete all recipients in this list."))
			return;

		try {
			const response = await fetch(`/api/recipient-lists/${id}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (data.success) {
				toast.success("List deleted successfully");
				fetchLists();
			} else {
				toast.error(data.error || "Failed to delete list");
			}
		} catch (error) {
			toast.error("Failed to delete list");
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-4xl font-bold tracking-tight">Recipient Lists</h1>
					<p className="text-muted-foreground text-lg mt-2">
						Manage your email recipient lists
					</p>
				</div>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="w-4 h-4 mr-2" />
							Create List
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Recipient List</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleCreate} className="space-y-4">
							<div>
								<Label htmlFor="name">List Name</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="My Customers"
									required
								/>
							</div>
							<div>
								<Label htmlFor="description">Description (Optional)</Label>
								<Input
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Customer email list"
								/>
							</div>
							<Button type="submit" disabled={creating} className="w-full">
								{creating ? "Creating..." : "Create List"}
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{lists.length === 0 ? (
				<div className="text-center py-12 bg-muted/50 rounded-lg">
					<Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">No recipient lists yet</h3>
					<p className="text-muted-foreground mb-4">
						Create your first list to start managing recipients
					</p>
					<Button onClick={() => setIsCreateOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Create Your First List
					</Button>
				</div>
			) : (
				<div className="grid gap-4">
					{lists.map((list) => (
						<div
							key={list._id}
							className="border rounded-lg p-6 hover:shadow-md transition-shadow"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<h3 className="text-xl font-semibold mb-1">{list.name}</h3>
									{list.description && (
										<p className="text-muted-foreground mb-3">
											{list.description}
										</p>
									)}
									<p className="text-sm text-muted-foreground">
										Created {new Date(list.createdAt).toLocaleDateString()}
									</p>
								</div>
								<div className="flex gap-2">
									<Link href={`/dashboard/recipient-lists/${list._id}`}>
										<Button variant="outline" size="sm">
											<Eye className="w-4 h-4 mr-2" />
											View
										</Button>
									</Link>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(list._id)}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
