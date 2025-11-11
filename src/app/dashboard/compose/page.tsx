import { EmailComposerForm } from "@/components/forms/email-composer-form";

export default function ComposePage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Compose Email</h1>
        <p className="text-muted-foreground mt-2">
          Send a tracked email with open and click tracking
        </p>
      </div>

      <EmailComposerForm />
    </div>
  );
}
