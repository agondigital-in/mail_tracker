"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddSmtpServerDialogProps {
	onSuccess?: () => void;
	trigger?: React.ReactNode;
	editData?: {
		_id: string;
		name: string;
		host: string;
		port: number;
		secure: boolean;
		username: string;
		fromEmail: string;
		fromName: string;
		isDefault: boolean;
	};
}

export function AddSmtpServerDialog({
	onSuccess,
	trigger,
	editData,
}: AddSmtpServerDialogProps) {
	const [name, setName] = useState(editData?.name || "");
	const [host, setHost] = useState(editData?.host || "");
	const [port, setPort] = useState(editData?.port?.toString() || "587");
	const [secure, setSecure] = useState(editData?.secure || false);
	const [username, setUsername] = useState(editData?.username || "");
	const [password, setPassword] = useState("");
	const [fromEmail, setFromEmail] = useState(editData?.fromEmail || "");
	const [fromName, setFromName] = useState(editData?.fromName || "");
	const [isDefault, setIsDefault] = useState(editData?.isDefault || false);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const isEditMode = !!editData;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const endpoint = isEditMode ? "/api/smtp-servers/update" : "/api/smtp-servers/create";
			const payload: any = {
				name,
				host,
				port: parseInt(port),
				secure,
				username,
				password,
				fromEmail,
				fromName,
				isDefault,
			};

			if (isEditMode) {
				payload.smtpServerId = editData._id;
			}

			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (data.success) {
				toast.success(isEditMode ? "SMTP server updated successfully!" : "SMTP server added successfully!");
				if (!isEditMode) {
					setName("");
					setHost("");
					setPort("587");
					setSecure(false);
					setUsername("");
					setPassword("");
					setFromEmail("");
					setFromName("");
					setIsDefault(false);
				}
				setOpen(false);
				if (onSuccess) {
					onSuccess();
				}
			} else {
				toast.error(isEditMode ? "Failed to update SMTP server" : "Failed to add SMTP server", {
					description: data.error || "Please try again",
				});
			}
		} catch (err) {
			toast.error("Network error", {
				description: "Please check your connection and try again",
			});
			console.error("Error with SMTP server:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Plus className="w-4 h-4 mr-2" />
						Add SMTP Server
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{isEditMode ? "Edit SMTP Server" : "Add SMTP Server"}</DialogTitle>
					<DialogDescription>
						{isEditMode ? "Update your email sending server configuration" : "Configure your email sending server"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 mt-4">
					<Field>
						<FieldLabel htmlFor="name">
							Server Name <span className="text-red-500">*</span>
						</FieldLabel>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="My SMTP Server"
							required
						/>
					</Field>

					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="host">
								Host <span className="text-red-500">*</span>
							</FieldLabel>
							<Input
								id="host"
								type="text"
								value={host}
								onChange={(e) => setHost(e.target.value)}
								placeholder="smtp.example.com"
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="port">
								Port <span className="text-red-500">*</span>
							</FieldLabel>
							<Input
								id="port"
								type="number"
								value={port}
								onChange={(e) => setPort(e.target.value)}
								placeholder="587"
								required
							/>
						</Field>
					</div>

					<Field>
						<FieldLabel htmlFor="username">
							Username <span className="text-red-500">*</span>
						</FieldLabel>
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="your-username"
							required
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="password">
							Password {!isEditMode && <span className="text-red-500">*</span>}
						</FieldLabel>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={isEditMode ? "Leave blank to keep current password" : "your-password"}
							required={!isEditMode}
						/>
						{isEditMode && (
							<p className="text-xs text-muted-foreground mt-1">
								Leave blank to keep current password
							</p>
						)}
					</Field>

					<Field>
						<FieldLabel htmlFor="fromEmail">
							From Email <span className="text-red-500">*</span>
						</FieldLabel>
						<Input
							id="fromEmail"
							type="email"
							value={fromEmail}
							onChange={(e) => setFromEmail(e.target.value)}
							placeholder="noreply@example.com"
							required
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="fromName">
							From Name <span className="text-red-500">*</span>
						</FieldLabel>
						<Input
							id="fromName"
							type="text"
							value={fromName}
							onChange={(e) => setFromName(e.target.value)}
							placeholder="My Company"
							required
						/>
					</Field>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="secure"
							checked={secure}
							onChange={(e) => setSecure(e.target.checked)}
							className="w-4 h-4"
						/>
						<label htmlFor="secure" className="text-sm">
							Use SSL/TLS (port 465)
						</label>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="isDefault"
							checked={isDefault}
							onChange={(e) => setIsDefault(e.target.checked)}
							className="w-4 h-4"
						/>
						<label htmlFor="isDefault" className="text-sm">
							Set as default SMTP server
						</label>
					</div>

					<div className="flex gap-3 justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update SMTP Server" : "Add SMTP Server")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
