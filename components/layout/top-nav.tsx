"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Bell, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopNavProps {
  onMenuToggle?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
  notificationCount?: number;
}

export function TopNav({
  onMenuToggle,
  breadcrumbs = [{ label: "Ayush Portal", href: "/" }, { label: "Platform Overview" }],
  notificationCount = 2,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-ayush-border/80 bg-ayush-card/95 px-4 sm:px-6 backdrop-blur-md shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ayush-border/80 text-ayush-dark hover:bg-ayush-sand/50 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-ayush-border">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-ayush-muted hover:text-ayush-brown transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-ayush-dark">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Verification status, Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Platform Badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-ayush-border/60 bg-ayush-sand/40 px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-ayush-green" />
          <span className="text-[11px] font-medium text-ayush-muted">
            Ayush Collaboration Network
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ayush-muted" />
          <input
            type="search"
            placeholder="Search skills, institutions..."
            className="h-8 w-48 lg:w-64 rounded-full border border-ayush-border/80 bg-ayush-parchment/60 pl-8 pr-3 text-xs text-ayush-dark placeholder:text-ayush-muted focus:bg-ayush-card focus:border-ayush-green focus:outline-none focus:ring-1 focus:ring-ayush-green transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-ayush-border/70 bg-ayush-card text-ayush-dark hover:bg-ayush-sand/50 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4 text-ayush-muted" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ayush-saffron text-[10px] font-bold text-white shadow-sm">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Portal Status */}
        <Badge variant="herbal" dot className="hidden xs:inline-flex text-[11px]">
          Platform Active
        </Badge>
      </div>
    </header>
  );
}
