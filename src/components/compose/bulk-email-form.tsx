"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Users, Plus } from "lucide-react";
import * as XLSX from "xlsx";

interface Recipient {
	name: string;
	email: string;
}

export function BulkEmailForm() {
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [recipients, setRecipients] = useState<Recipient[]>([]);
	const [campaigns, setCampaigns] = useState<any[]>([]);
	const [selectedCampaign, setSelectedCampaign] = useState("");
	const [loading, setLoading] = useState(false);
	const [fileName, setFileName] = useState("");

	useEffect(() => {
		fetchCampaigns();
	}, []);

	const fetchCampaigns = async () => {
		try {
			const response = await fetch("/api/campaigns/list");
			const data = await response.json();
			if (data.success) {
				setCampaigns(data.campaigns);
			}
		} catch (err) {
			console.error("Error fetching campaigns:", err);
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setFileName(file.name);

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = event.target?.result;
				const workbook = XLSX.read(data, { type: "binary" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const jsonData = XLSX.utils.sheet_to_json(worksheet);

				const parsedRecipients: Recipient[] = jsonData.map((row: any) => ({
					name: row.Name || row.name || "",
					email: row.Email || row.email || "",
				}));

				const validRecipients = parsedRecipients.filter(
					(r) => r.email && r.email.includes("@"),
				);

				if (validRecipients.length === 0) {
					toast.error("No valid emails found", {
						description: "Please ensure your Excel has 'Name' and 'Email' columns",
					});
					return;
				}

				setRecipients(validRecipients);
				toast.success(`Loaded ${validRecipients.length} recipients`);
			} catch (err) {
				toast.error("Failed to parse Excel file", {
					description: "Please check the file format",
				});
				console.error("Error parsing Excel:", err);
			}
		};
		reader.readAsBinaryString(file);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (recipients.length === 0) {
			toast.error("No recipients", {
				description: "Please upload an Excel file with recipients",
			});
			return;
		}

		if (!selectedCampaign) {
			toast.error("No campaign selected", {
				description: "Please select or create a campaign",
			});
			return;
		}

		setLoading(true);

		try {
			let successCount = 0;
			let failCount = 0;

			for (const recipient of recipients) {
				try {
					const response = await fetch("/api/emails/send", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							to: recipient.email,
							subject: subject.replace("{{name}}", recipient.name),
							html: body.replace(/{{name}}/g, recipient.name),
							campaignId: selectedCampaign,
						}),
					});

					const data = await response.json();
					if (data.success) {
						successCount++;
					} else {
						failCount++;
					}
				} catch (err) {
					failCount++;
					console.error(`Error sending to ${recipient.email}:`, err);
				}
			}

			if (successCount > 0) {
				toast.success(`Sent ${successCount} emails successfully!`);
				setSubject("");
				setBody("");
				setRecipients([]);
				setFileName("");
				setSelectedCampaign("");
			}

			if (failCount > 0) {
				toast.warning(`${failCount} emails failed to send`);
			}
		} catch (err) {
			toast.error("Failed to send emails", {
				description: "Please try again",
			});
			console.error("Error sending bulk emails:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleCampaignCreated = (campaignId: string) => {
		fetchCampaigns();
		setSelectedCampaign(campaignId);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="w-5 h-5" />
					Bulk Email Compose
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Excel Upload */}
					<Field>
						<FieldLabel htmlFor="excel">
							Upload Recipients (Excel) <span className="text-red-500">*</span>
						</FieldLabel>
						<div className="flex items-center gap-2">
							<label
								htmlFor="excel"
								className="flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
							>
								{fileName ? (
									<>
										<FileSpreadsheet className="w-5 h-5 text-green-600" />
										<span className="text-sm font-medium">{fileName}</span>
										<span className="text-xs text-muted-foreground">
											({recipients.length} recipients)
										</span>
									</>
								) : (
									<>
										<Upload className="w-5 h-5" />
										<span className="text-sm">Click to upload Excel file</span>
									</>
								)}
							</label>
							<input
								id="excel"
								type="file"
								accept=".xlsx,.xls"
								onChange={handleFileUpload}
								className="hidden"
							/>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Excel should have columns: <strong>Name</strong> and{" "}
							<strong>Email</strong>
						</p>
					</Field>

					{/* Campaign Selection */}
					<Field>
						<FieldLabel htmlFor="campaign">
							Campaign <span className="text-red-500">*</span>
						</FieldLabel>
						<div className="flex gap-2">
							<Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder="Select a campaign" />
								</SelectTrigger>
								<SelectContent>
									{campaigns.map((campaign) => (
										<SelectItem key={campaign._id} value={campaign._id}>
											{campaign.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<CreateCampaignDialog
								onSuccess={handleCampaignCreated}
								trigger={
									<Button type="button" variant="outline" size="icon">
										<Plus className="w-4 h-4" />
									</Button>
								}
							/>
						</div>
					</Field>

					{/* Subject */}
					<Field>
						<FieldLabel htmlFor="subject">
							Subject <span className="text-red-500">*</span>
						</FieldLabel>
						<Input
							id="subject"
							type="text"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Hello {{name}}, check this out!"
							required
						/>
						<p className="text-xs text-muted-foreground mt-1">
							Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> for
							personalization
						</p>
					</Field>

					{/* Body */}
					<Field>
						<FieldLabel htmlFor="body">
							Email Content (HTML) <span className="text-red-500">*</span>
						</FieldLabel>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							<div className="flex flex-col">
								<textarea
									id="body"
									value={body}
									onChange={(e) => setBody(e.target.value)}
									placeholder="<h1>Hi {{name}}</h1><p>Your personalized HTML template here...</p>"
									className="flex-1 min-h-[300px] max-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-y"
									required
								/>
								<p className="text-xs text-muted-foreground mt-2">
									HTML Editor - Use{" "}
									<code className="bg-muted px-1 rounded">{"{{name}}"}</code> for
									personalization
								</p>
							</div>
							<div className="flex flex-col">
								<iframe
									srcDoc={body.replace(/{{name}}/g, "John Doe")}
									className="flex-1 min-h-[300px] max-h-[400px] w-full rounded-md border border-input bg-white"
									title="Email Preview"
									sandbox="allow-same-origin"
								/>
								<p className="text-xs text-muted-foreground mt-2">
									Live Preview (
									<code className="bg-muted px-1 rounded">{"{{name}}"}</code>{" "}
									shown as John Doe)
								</p>
							</div>
						</div>
					</Field>

					<Button
						type="submit"
						disabled={loading || recipients.length === 0}
						className="w-full"
					>
						{loading
							? "Sending..."
							: `Send to ${recipients.length} Recipients`}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
