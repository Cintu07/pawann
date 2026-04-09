"use client";

import { useState } from "react";
import {
    Search,
    Plus,
    Phone,
    Trash2,
    Mail,
    MoreHorizontal,
    Building2,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const accounts = [
    {
        id: "1",
        name: "mo",
        email: "needless@gmail.com",
        role: "cortex admin",
        company: null,
        phone: null,
        createdAt: "12/27/2025",
    },
    {
        id: "2",
        name: "moe",
        email: "need@gmail.com",
        role: "cortex admin",
        company: null,
        phone: null,
        createdAt: "12/27/2025",
    },
    {
        id: "3",
        name: "moe",
        email: "needles@gmail.com",
        role: "manager",
        company: "TechCorp Inc",
        phone: null,
        createdAt: "12/27/2025",
    },
    {
        id: "4",
        name: "Test",
        email: "test@yopmail.com",
        role: "cortex admin",
        company: null,
        phone: "+1 555-123-4567",
        createdAt: "10/13/2025",
    },
    {
        id: "5",
        name: "New Profile",
        email: "newprofile@example.com",
        role: "cortex admin",
        company: "Acme Corp",
        phone: "+1 555-987-6543",
        createdAt: "12/25/2025",
    },
    {
        id: "6",
        name: "Restaurant Owner",
        email: "owner@restaurant.com",
        role: "manager",
        company: "Downtown Bistro",
        phone: "+1 555-456-7890",
        createdAt: "12/20/2025",
    },
];

const roleColors: Record<string, string> = {
    "cortex admin": "bg-red-500/10 text-red-400 border-red-500/20",
    manager: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    staff: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function AccountsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAccounts = accounts.filter(
        (account) =>
            account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (account.company &&
                account.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                        <Users className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Account Management
                        </h1>
                        <p className="text-muted-foreground">
                            {accounts.length} accounts total
                        </p>
                    </div>
                </div>
                <Button className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                    <Plus className="h-4 w-4" />
                    Add Account
                </Button>
            </div>

            {/* Search */}
            <Card className="glass-card">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by email, name, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-12 text-base bg-background/50"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Accounts List */}
            <div className="space-y-3">
                {filteredAccounts.map((account) => (
                    <Card key={account.id} className="glass-card overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-border/50">
                                        <AvatarFallback className="bg-muted text-muted-foreground">
                                            <Mail className="h-5 w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold">{account.name}</span>
                                            <Badge
                                                variant="outline"
                                                className={roleColors[account.role] || roleColors.staff}
                                            >
                                                {account.role}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {account.email}
                                        </p>
                                        {account.company && (
                                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                                <Building2 className="h-3 w-3" />
                                                {account.company}
                                            </div>
                                        )}
                                        {!account.phone && (
                                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                <Phone className="h-3 w-3" />
                                                No phone set
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                        {account.createdAt}
                                    </span>
                                    {account.phone && (
                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                            <Phone className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Edit Account</DropdownMenuItem>
                                            <DropdownMenuItem>View Analytics</DropdownMenuItem>
                                            <DropdownMenuItem>Impersonate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-400">
                                                Delete Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
