"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RecipientListDetailPage() {
	const params = useParams();
	const listId = params.id as string;
	const [list, setList] = useState<any>(null);
	const [recipients, setRecipients] = useState<any[]>([]);
	const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0 });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch(`/api/recipient-lists/${listId}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.success) {
					setList(data.list);
					setRecipients(data.recipients);
					setStats(data.stats);
				}
				setLoading(false);
			});
	}, [listId]);

	if (loading) return <div className="container mx-auto py-8 px-4">Loading...</div>;
	if (!list) return <div className="container mx-auto py-8 px-4">List not found</div>;

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<Link href="/dashboard/recipient-lists">
				<Button variant="ghost" className="mb-4">
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Lists
				</Button>
			</Link>

			<h1 className="text-4xl font-bold mb-8">{list.name}</h1>

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
					<p className="text-3xl font-bold text-red-600">{stats.unsubscribed}</p>
				</div>
			</div>

			<div className="border rounded-lg">
				<table className="w-full">
					<thead className="border-b bg-muted/50">
						<tr>
							<th className="text-left p-4">Email</th>
							<th className="text-left p-4">Name</th>
							<th className="text-left p-4">Status</th>
						</tr>
					</thead>
					<tbody>
						{recipients.length === 0 ? (
							<tr>
								<td colSpan={3} className="text-center p-8 text-muted-foreground">
									No recipients yet
								</td>
							</tr>
						) : (
							recipients.map((recipient) => (
								<tr key={recipient._id} className="border-b">
									<td className="p-4">{recipient.email}</td>
									<td className="p-4">{recipient.name || "-"}</td>
									<td className="p-4">
										{recipient.unsubscribed ? (
											<span className="text-red-600">Unsubscribed</span>
										) : (
											<span className="text-green-600">Active</span>
										)}
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
