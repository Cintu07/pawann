"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Users,
    TicketCheck,
    BarChart3,
    Activity,
    Settings,
    ChevronLeft,
    Sparkles,
    LogOut,
    Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminNavItems = [
    { name: "Accounts", href: "/admin/accounts", icon: Users },
    { name: "Tickets", href: "/admin/tickets", icon: TicketCheck },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
];

const bottomNavItems = [
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background dark">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-sidebar transition-all duration-300",
                    collapsed ? "w-[70px]" : "w-[260px]"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo Header */}
                    <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
                        <Link href="/admin/accounts" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            {!collapsed && (
                                <div>
                                    <span className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                        Cortex
                                    </span>
                                    <span className="text-xs text-muted-foreground block">Admin</span>
                                </div>
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
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Admin Panel
                                </p>
                            )}
                            <nav className="space-y-1">
                                {adminNavItems.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        pathname.startsWith(item.href + "/");
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
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

                        {/* Quick Link to Merchant View */}
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Quick Access
                                </p>
                            )}
                            <Link
                                href="/merchant/dashboard"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                            >
                                <Home className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>Merchant View</span>}
                            </Link>
                        </div>
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
                                                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        {!collapsed && <span>{item.name}</span>}
                                    </Link>
                                );
                            })}
                            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>Logout</span>}
                            </button>
                        </nav>

                        {/* Admin Profile */}
                        {!collapsed && (
                            <div className="mt-4 flex items-center gap-3 rounded-lg bg-accent/30 p-3">
                                <Avatar className="h-9 w-9 border-2 border-orange-500/20">
                                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-sm font-medium">
                                        AD
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">Admin User</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        admin@cortex.ai
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    "min-h-screen transition-all duration-300",
                    collapsed ? "pl-[70px]" : "pl-[260px]"
                )}
            >
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
