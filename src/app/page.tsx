import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold">Email Tracking & Analytics</h1>
        <p className="text-lg text-muted-foreground">
          Track email opens, clicks, and engagement with powerful analytics
        </p>
        <div className="flex flex-col gap-4 sm:flex-row justify-center">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
        <div className="pt-8 space-y-2 text-sm text-muted-foreground">
          <p>✓ Email open tracking</p>
          <p>✓ Click tracking</p>
          <p>✓ Campaign analytics</p>
          <p>✓ Bounce monitoring</p>
        </div>
      </div>
    </div>
  );
}
