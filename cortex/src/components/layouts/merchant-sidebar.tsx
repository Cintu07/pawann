"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Phone,
  UtensilsCrossed,
  BarChart3,
  BookOpen,
  Calendar,
  HelpCircle,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const merchantNavItems = [
  {
    title: "MERCHANT TOOLS",
    items: [
      { name: "Dashboard", href: "/merchant/dashboard", icon: LayoutDashboard },
      { name: "Orders", href: "/merchant/orders", icon: ShoppingCart },
      { name: "Bookings", href: "/merchant/bookings", icon: Calendar },
      { name: "Phone Calls", href: "/merchant/phone-calls", icon: Phone },
      { name: "Voice Agents", href: "/merchant/voice-agents", icon: Sparkles },
      { name: "Menus", href: "/merchant/menus", icon: UtensilsCrossed },
      { name: "Knowledge Base", href: "/merchant/knowledge-base", icon: BookOpen },
      { name: "Analytics", href: "/merchant/analytics", icon: BarChart3 },
    ],
  },
];

const bottomNavItems = [
  { name: "Get Help", href: "/merchant/support", icon: HelpCircle },
  { name: "Settings", href: "/merchant/settings", icon: Settings },
];

export function MerchantSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-sidebar transition-all duration-300",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
          <Link href="/merchant/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary glow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold gradient-text">Cortex</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          {merchantNavItems.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg glow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 flex-shrink-0")} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </ScrollArea>

        {/* Bottom Navigation */}
        <div className="border-t border-border/50 px-3 py-4">
          <nav className="space-y-1">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
