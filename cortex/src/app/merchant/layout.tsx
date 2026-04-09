"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MerchantSidebar } from "@/components/layouts/merchant-sidebar";
import { Topbar } from "@/components/layouts/topbar";

export default function MerchantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-background dark">
            <MerchantSidebar />
            <Topbar sidebarCollapsed={sidebarCollapsed} />
            <main
                className={cn(
                    "min-h-screen pt-16 transition-all duration-300",
                    sidebarCollapsed ? "pl-[70px]" : "pl-[260px]"
                )}
            >
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
