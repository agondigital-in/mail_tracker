import { Send } from "lucide-react";
import { EmailComposerForm } from "@/components/forms/email-composer-form";

export default function ComposePage() {
	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
						<Send className="w-6 h-6 text-white" />
					</div>
					<h1 className="text-4xl font-bold tracking-tight">Compose Email</h1>
				</div>
				<p className="text-muted-foreground text-lg ml-15">
					Send a tracked email with open and click tracking
				</p>
			</div>

			<EmailComposerForm />
		</div>
	);
}
