"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Bell,
    Search,
    Store,
    ChevronDown,
    Moon,
    Sun,
    User,
    LogOut,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
    sidebarCollapsed?: boolean;
}

const stores = [
    { id: "1", name: "All Merchants", icon: "🏪" },
    { id: "2", name: "Default Store", icon: "🏠" },
    { id: "3", name: "Downtown Location", icon: "🌆" },
];

export function Topbar({ sidebarCollapsed = false }: TopbarProps) {
    const [selectedStore, setSelectedStore] = useState(stores[0]);
    const [storeMode, setStoreMode] = useState(false);
    const [isDark, setIsDark] = useState(true);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    return (
        <header
            className={cn(
                "fixed top-0 right-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl transition-all duration-300",
                sidebarCollapsed ? "left-[70px]" : "left-[260px]"
            )}
        >
            <div className="flex h-full items-center justify-between px-6">
                {/* Left Section - Store Selector & Search */}
                <div className="flex items-center gap-4">
                    {/* Store Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-10 gap-2 border-border/50 bg-card/50 hover:bg-accent"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                                    <Store className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{selectedStore.name}</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Switch Store</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {stores.map((store) => (
                                <DropdownMenuItem
                                    key={store.id}
                                    onClick={() => setSelectedStore(store)}
                                    className={cn(
                                        "cursor-pointer",
                                        selectedStore.id === store.id && "bg-accent"
                                    )}
                                >
                                    <span className="mr-2">{store.icon}</span>
                                    {store.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Search Bar */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search orders, calls, bookings..."
                            className="h-10 w-[300px] pl-9 bg-card/50 border-border/50 focus:border-primary/50"
                        />
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-3">
                    {/* Store Mode Toggle */}
                    <Button
                        variant={storeMode ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "gap-2 transition-all",
                            storeMode && "glow-sm"
                        )}
                        onClick={() => setStoreMode(!storeMode)}
                    >
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full",
                                storeMode ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
                            )}
                        />
                        {storeMode ? "Active Store Mode" : "Store Mode"}
                    </Button>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={toggleTheme}
                    >
                        {isDark ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </Button>

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative h-10 w-10">
                        <Bell className="h-5 w-5" />
                        <Badge
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center gradient-primary border-0"
                        >
                            3
                        </Badge>
                    </Button>

                    {/* Profile Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-10 gap-2 px-2 hover:bg-accent"
                            >
                                <Avatar className="h-8 w-8 border-2 border-primary/20">
                                    <AvatarImage src="/avatar.png" alt="User" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                        JD
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-medium">John Doe</span>
                                    <span className="text-xs text-muted-foreground">
                                        john@example.com
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
