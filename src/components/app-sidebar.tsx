"use client";

import {
  FolderKanban,
  GalleryVerticalEnd,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings2,
  Users,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "mail-tracker",
      logo: GalleryVerticalEnd,
      plan: "default",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Compose",
      url: "#",
      icon: Mail,
      items: [
        {
          title: "Single Email",
          url: "/dashboard/compose",
        },
        {
          title: "Bulk Email",
          url: "/dashboard/bulk-compose",
        },
      ],
    },
    {
      title: "Campaigns",
      url: "/dashboard/campaigns",
      icon: FolderKanban,
    },
    {
      title: "Emails",
      url: "/dashboard/emails",
      icon: Inbox,
    },
    {
      title: "Recipient Lists",
      url: "/dashboard/recipient-lists",
      icon: Users,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "SMTP Servers",
          url: "/dashboard/smtp-servers",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}) {
  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar || "/avatars/default.jpg",
      }
    : data.user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
