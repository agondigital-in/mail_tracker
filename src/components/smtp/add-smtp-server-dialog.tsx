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
}

export function AddSmtpServerDialog({
	onSuccess,
	trigger,
}: AddSmtpServerDialogProps) {
	const [name, setName] = useState("");
	const [host, setHost] = useState("");
	const [port, setPort] = useState("587");
	const [secure, setSecure] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [fromEmail, setFromEmail] = useState("");
	const [fromName, setFromName] = useState("");
	const [isDefault, setIsDefault] = useState(false);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/smtp-servers/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					host,
					port: parseInt(port),
					secure,
					username,
					password,
					fromEmail,
					fromName,
					isDefault,
				}),
			});

			const data = await response.json();

			if (data.success) {
				toast.success("SMTP server added successfully!");
				setName("");
				setHost("");
				setPort("587");
				setSecure(false);
				setUsername("");
				setPassword("");
				setFromEmail("");
				setFromName("");
				setIsDefault(false);
				setOpen(false);
				if (onSuccess) {
					onSuccess();
				}
			} else {
				toast.error("Failed to add SMTP server", {
					description: data.error || "Please try again",
				});
			}
		} catch (err) {
			toast.error("Network error", {
				description: "Please check your connection and try again",
			});
			console.error("Error adding SMTP server:", err);
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
					<DialogTitle>Add SMTP Server</DialogTitle>
					<DialogDescription>
						Configure your email sending server
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
							Password <span className="text-red-500">*</span>
						</FieldLabel>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="your-password"
							required
						/>
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
							{loading ? "Adding..." : "Add SMTP Server"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
