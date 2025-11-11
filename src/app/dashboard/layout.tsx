import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <h2 className="text-xl font-bold">Email Tracker</h2>
              <div className="flex space-x-4">
                <a
                  href="/dashboard"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/dashboard/compose"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Compose
                </a>
                <a
                  href="/dashboard/campaigns"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Campaigns
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <form action="/api/auth/sign-out" method="POST">
                <button
                  type="submit"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
