"use client";

import { useState } from "react";
import {
    Search,
    Plus,
    TicketCheck,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tickets = [
    {
        id: "TKT-001",
        subject: "Issue with phone integration",
        client: "TechCorp Inc",
        clientEmail: "tech@corp.com",
        status: "open",
        priority: "high",
        createdAt: "Dec 28, 2024",
    },
    {
        id: "TKT-002",
        subject: "Menu items not updating",
        client: "Downtown Bistro",
        clientEmail: "bistro@email.com",
        status: "in_progress",
        priority: "medium",
        createdAt: "Dec 27, 2024",
    },
    {
        id: "TKT-003",
        subject: "Need help with booking setup",
        client: "Acme Corp",
        clientEmail: "acme@corp.com",
        status: "resolved",
        priority: "low",
        createdAt: "Dec 26, 2024",
    },
    {
        id: "TKT-004",
        subject: "Voice agent speaking too fast",
        client: "Pizza Palace",
        clientEmail: "pizza@palace.com",
        status: "open",
        priority: "high",
        createdAt: "Dec 28, 2024",
    },
    {
        id: "TKT-005",
        subject: "Billing inquiry",
        client: "Restaurant XYZ",
        clientEmail: "xyz@restaurant.com",
        status: "closed",
        priority: "low",
        createdAt: "Dec 20, 2024",
    },
];

const statusColors: Record<string, string> = {
    open: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    closed: "bg-muted text-muted-foreground border-muted",
};

const priorityColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    low: "bg-muted text-muted-foreground border-muted",
};

export default function AdminTicketsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("open");

    const filterByStatus = (status: string) =>
        tickets.filter((t) => t.status === status);

    const getTabContent = (status: string) => {
        const filtered = filterByStatus(status);
        if (filtered.length === 0) {
            return (
                <div className="text-center py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                        {status === "open" && <AlertCircle className="h-8 w-8 text-muted-foreground" />}
                        {status === "in_progress" && <Clock className="h-8 w-8 text-muted-foreground" />}
                        {status === "resolved" && <CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
                        {status === "closed" && <XCircle className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <p className="text-lg font-medium">No {status.replace("_", " ")} tickets</p>
                    <p className="text-muted-foreground">
                        {status === "open"
                            ? "All tickets have been addressed!"
                            : `No tickets are currently ${status.replace("_", " ")}.`}
                    </p>
                </div>
            );
        }

        return (
            <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="font-semibold">Subject</TableHead>
                            <TableHead className="font-semibold">Client</TableHead>
                            <TableHead className="font-semibold">Priority</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Created At</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((ticket) => (
                            <TableRow key={ticket.id} className="hover:bg-accent/50 cursor-pointer">
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{ticket.subject}</p>
                                        <p className="text-xs text-muted-foreground">{ticket.id}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{ticket.client}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ticket.clientEmail}
                                        </p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={priorityColors[ticket.priority]}>
                                        {ticket.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={statusColors[ticket.status]}>
                                        {ticket.status.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {ticket.createdAt}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Assign to Me</DropdownMenuItem>
                                            <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                                            <DropdownMenuItem>Close Ticket</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                        <TicketCheck className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            All Support Tickets
                        </h1>
                        <p className="text-muted-foreground">
                            Manage tickets from all clients
                        </p>
                    </div>
                </div>
                <Button className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                    <Plus className="h-4 w-4" />
                    New Ticket
                </Button>
            </div>

            {/* Tabs */}
            <Card className="glass-card">
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger
                                    value="open"
                                    className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                                >
                                    Open ({filterByStatus("open").length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="in_progress"
                                    className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                                >
                                    In Progress ({filterByStatus("in_progress").length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="resolved"
                                    className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                                >
                                    Resolved ({filterByStatus("resolved").length})
                                </TabsTrigger>
                                <TabsTrigger value="closed" className="data-[state=active]:bg-muted">
                                    Closed ({filterByStatus("closed").length})
                                </TabsTrigger>
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

                        <TabsContent value="open" className="mt-6">
                            {getTabContent("open")}
                        </TabsContent>
                        <TabsContent value="in_progress" className="mt-6">
                            {getTabContent("in_progress")}
                        </TabsContent>
                        <TabsContent value="resolved" className="mt-6">
                            {getTabContent("resolved")}
                        </TabsContent>
                        <TabsContent value="closed" className="mt-6">
                            {getTabContent("closed")}
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    );
}
