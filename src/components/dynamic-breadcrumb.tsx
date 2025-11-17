"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  compose: "Compose Email",
  "bulk-compose": "Bulk Compose",
  campaigns: "Campaigns",
  emails: "Emails",
  "smtp-servers": "SMTP Servers",
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Split pathname and filter empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Remove 'dashboard' from segments if it's the first one
  const pathSegments = segments.filter((segment) => segment !== "dashboard");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Email Tracker</BreadcrumbLink>
        </BreadcrumbItem>

        {pathSegments.length === 0 ? (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          pathSegments.map((segment, index) => {
            const isLast = index === pathSegments.length - 1;
            const href = `/dashboard/${pathSegments.slice(0, index + 1).join("/")}`;
            const label =
              routeNames[segment] ||
              segment.charAt(0).toUpperCase() + segment.slice(1);

            return (
              <div key={segment} className="flex items-center gap-2">
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            );
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
