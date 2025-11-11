import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-2xl px-4">
        <div className="text-center space-y-8 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border shadow-2xl">
          <div className="space-y-4">
            <div className="inline-block p-3 rounded-2xl bg-primary/10 mb-4">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Email Tracking & Analytics
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Track email opens, clicks, and engagement with powerful real-time
              analytics
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          <div className="pt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Email open tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Click tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Campaign analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Bounce monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
