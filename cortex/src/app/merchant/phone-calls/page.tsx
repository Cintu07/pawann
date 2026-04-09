"use client";

import { useState } from "react";
import {
    Search,
    Filter,
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Play,
    MoreHorizontal,
    Bot,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const calls = [
    {
        id: "CALL-001",
        type: "incoming",
        number: "+1 (555) 123-4567",
        duration: "4:32",
        status: "answered",
        handler: "AI",
        outcome: "Order Placed",
        timestamp: "2024-12-28 10:30 AM",
    },
    {
        id: "CALL-002",
        type: "incoming",
        number: "+1 (555) 987-6543",
        duration: "2:15",
        status: "answered",
        handler: "AI",
        outcome: "Reservation Made",
        timestamp: "2024-12-28 10:15 AM",
    },
    {
        id: "CALL-003",
        type: "missed",
        number: "+1 (555) 456-7890",
        duration: "-",
        status: "missed",
        handler: "-",
        outcome: "-",
        timestamp: "2024-12-28 10:05 AM",
    },
    {
        id: "CALL-004",
        type: "outgoing",
        number: "+1 (555) 321-0987",
        duration: "1:48",
        status: "completed",
        handler: "Staff",
        outcome: "Follow-up",
        timestamp: "2024-12-28 09:45 AM",
    },
    {
        id: "CALL-005",
        type: "incoming",
        number: "+1 (555) 654-3210",
        duration: "5:22",
        status: "answered",
        handler: "AI",
        outcome: "General Inquiry",
        timestamp: "2024-12-28 09:30 AM",
    },
];

const callTypeIcons = {
    incoming: PhoneIncoming,
    outgoing: PhoneOutgoing,
    missed: PhoneMissed,
};

const statusColors: Record<string, string> = {
    answered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    missed: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function PhoneCallsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Phone Calls</h1>
                <p className="text-muted-foreground">
                    View and manage all incoming and outgoing calls.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">847</p>
                                <p className="text-xs text-muted-foreground">Total Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Bot className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">756</p>
                                <p className="text-xs text-muted-foreground">AI Handled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                                <PhoneMissed className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">12</p>
                                <p className="text-xs text-muted-foreground">Missed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <User className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">79</p>
                                <p className="text-xs text-muted-foreground">Staff Handled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calls Table */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="all">All Calls</TabsTrigger>
                                <TabsTrigger value="incoming">Incoming</TabsTrigger>
                                <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
                                <TabsTrigger value="missed">Missed</TabsTrigger>
                            </TabsList>

                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search calls..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-[250px] bg-background/50"
                                    />
                                </div>
                                <Button variant="outline" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="all" className="mt-4">
                            <div className="rounded-lg border border-border/50 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="font-semibold">Type</TableHead>
                                            <TableHead className="font-semibold">Phone Number</TableHead>
                                            <TableHead className="font-semibold">Duration</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold">Handler</TableHead>
                                            <TableHead className="font-semibold">Outcome</TableHead>
                                            <TableHead className="font-semibold">Time</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {calls.map((call) => {
                                            const Icon = callTypeIcons[call.type as keyof typeof callTypeIcons];
                                            return (
                                                <TableRow key={call.id} className="hover:bg-accent/50">
                                                    <TableCell>
                                                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${call.type === "missed" ? "bg-red-500/10" : "bg-primary/10"
                                                            }`}>
                                                            <Icon className={`h-4 w-4 ${call.type === "missed" ? "text-red-500" : "text-primary"
                                                                }`} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{call.number}</TableCell>
                                                    <TableCell>{call.duration}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={statusColors[call.status]}>
                                                            {call.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            call.handler === "AI"
                                                                ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                                                : "bg-muted text-muted-foreground"
                                                        }>
                                                            {call.handler}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{call.outcome}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {call.timestamp}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Play className="h-4 w-4" />
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem>View Transcript</DropdownMenuItem>
                                                                    <DropdownMenuItem>Download Recording</DropdownMenuItem>
                                                                    <DropdownMenuItem>Call Back</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    );
}
