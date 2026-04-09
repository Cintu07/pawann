"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tickets = [
    {
        id: "TKT-001",
        subject: "Issue with phone integration",
        message: "The AI agent is not answering calls properly...",
        status: "open",
        priority: "high",
        createdAt: "Dec 28, 2024 10:30 AM",
        updatedAt: "Dec 28, 2024 11:15 AM",
    },
    {
        id: "TKT-002",
        subject: "Menu items not updating",
        message: "I updated my menu but the AI still mentions old items...",
        status: "in_progress",
        priority: "medium",
        createdAt: "Dec 27, 2024 3:45 PM",
        updatedAt: "Dec 28, 2024 9:00 AM",
    },
    {
        id: "TKT-003",
        subject: "Need help with booking setup",
        message: "How do I configure the booking time slots?",
        status: "resolved",
        priority: "low",
        createdAt: "Dec 26, 2024 2:00 PM",
        updatedAt: "Dec 26, 2024 4:30 PM",
    },
];

const statusColors: Record<string, string> = {
    open: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    closed: "bg-muted text-muted-foreground border-muted",
};

const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-muted text-muted-foreground border-muted",
};

const statusIcons = {
    open: AlertCircle,
    in_progress: Clock,
    resolved: CheckCircle2,
    closed: XCircle,
};

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filterByStatus = (status: string) =>
        tickets.filter((t) => t.status === status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Support</h1>
                    <p className="text-muted-foreground">
                        Get help with your account and services.
                    </p>
                </div>
                <Button className="gap-2 glow-sm">
                    <Plus className="h-4 w-4" />
                    New Ticket
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{filterByStatus("open").length}</p>
                                <p className="text-xs text-muted-foreground">Open Tickets</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{filterByStatus("in_progress").length}</p>
                                <p className="text-xs text-muted-foreground">In Progress</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{filterByStatus("resolved").length}</p>
                                <p className="text-xs text-muted-foreground">Resolved</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{tickets.length}</p>
                                <p className="text-xs text-muted-foreground">Total Tickets</p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets */}
            <Card className="glass-card">
                <CardHeader>
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="open">Open</TabsTrigger>
                                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                            </TabsList>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-[250px] bg-background/50"
                                />
                            </div>
                        </div>

                        <TabsContent value="all" className="mt-6 space-y-3">
                            {tickets.map((ticket) => {
                                const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
                                return (
                                    <div
                                        key={ticket.id}
                                        className="flex items-start justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                <StatusIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-muted-foreground">{ticket.id}</span>
                                                    <Badge variant="outline" className={priorityColors[ticket.priority]}>
                                                        {ticket.priority}
                                                    </Badge>
                                                </div>
                                                <p className="font-medium">{ticket.subject}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {ticket.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={statusColors[ticket.status]}>
                                                {ticket.status.replace("_", " ")}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Updated {ticket.updatedAt}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </TabsContent>

                        <TabsContent value="open" className="mt-6 space-y-3">
                            {filterByStatus("open").length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No open tickets</p>
                                </div>
                            ) : (
                                filterByStatus("open").map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-start justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <p className="font-medium">{ticket.subject}</p>
                                            <p className="text-sm text-muted-foreground">{ticket.id}</p>
                                        </div>
                                        <Badge variant="outline" className={statusColors[ticket.status]}>
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="in_progress" className="mt-6 space-y-3">
                            {filterByStatus("in_progress").length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No tickets in progress</p>
                                </div>
                            ) : (
                                filterByStatus("in_progress").map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-start justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <p className="font-medium">{ticket.subject}</p>
                                            <p className="text-sm text-muted-foreground">{ticket.id}</p>
                                        </div>
                                        <Badge variant="outline" className={statusColors[ticket.status]}>
                                            in progress
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="resolved" className="mt-6 space-y-3">
                            {filterByStatus("resolved").length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">No resolved tickets</p>
                                </div>
                            ) : (
                                filterByStatus("resolved").map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-start justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <p className="font-medium">{ticket.subject}</p>
                                            <p className="text-sm text-muted-foreground">{ticket.id}</p>
                                        </div>
                                        <Badge variant="outline" className={statusColors[ticket.status]}>
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    );
}
