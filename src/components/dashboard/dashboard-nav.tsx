"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/properties", label: "Biens", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Users },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
