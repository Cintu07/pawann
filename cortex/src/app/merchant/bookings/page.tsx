"use client";

import { useState } from "react";
import {
    Search,
    Filter,
    Plus,
    Calendar,
    Clock,
    Users,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
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

const bookings = [
    {
        id: "BK-001",
        name: "John & Sarah",
        phone: "+1 (555) 123-4567",
        date: "Dec 28, 2024",
        time: "7:00 PM",
        guests: 4,
        status: "confirmed",
        notes: "Anniversary dinner, window seat requested",
    },
    {
        id: "BK-002",
        name: "Corporate Event - Tech Inc",
        phone: "+1 (555) 987-6543",
        date: "Dec 29, 2024",
        time: "12:00 PM",
        guests: 12,
        status: "confirmed",
        notes: "Business lunch, separate checks needed",
    },
    {
        id: "BK-003",
        name: "Birthday Party - Mike",
        phone: "+1 (555) 456-7890",
        date: "Dec 30, 2024",
        time: "6:30 PM",
        guests: 8,
        status: "pending",
        notes: "Surprise party, need cake arrangement",
    },
    {
        id: "BK-004",
        name: "Date Night - Emily",
        phone: "+1 (555) 321-0987",
        date: "Dec 28, 2024",
        time: "8:00 PM",
        guests: 2,
        status: "confirmed",
        notes: "Quiet corner preferred",
    },
    {
        id: "BK-005",
        name: "Family Dinner - Johnsons",
        phone: "+1 (555) 654-3210",
        date: "Jan 1, 2025",
        time: "5:00 PM",
        guests: 6,
        status: "waitlist",
        notes: "High chair needed for toddler",
    },
];

const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    waitlist: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-muted text-muted-foreground border-muted",
};

export default function BookingsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const todayBookings = bookings.filter((b) => b.date === "Dec 28, 2024");
    const upcomingBookings = bookings.filter((b) => b.date !== "Dec 28, 2024");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                    <p className="text-muted-foreground">
                        Manage reservations and table bookings.
                    </p>
                </div>
                <Button className="gap-2 glow-sm">
                    <Plus className="h-4 w-4" />
                    New Booking
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{todayBookings.length}</p>
                                <p className="text-xs text-muted-foreground">Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Users className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {todayBookings.reduce((sum, b) => sum + b.guests, 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">Guests Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <Clock className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {bookings.filter((b) => b.status === "pending").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                                <p className="text-xs text-muted-foreground">Upcoming</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>All Bookings</CardTitle>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search bookings..."
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
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="font-semibold">Guest Name</TableHead>
                                    <TableHead className="font-semibold">Phone</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="font-semibold">Time</TableHead>
                                    <TableHead className="font-semibold">Party Size</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Notes</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id} className="hover:bg-accent/50">
                                        <TableCell className="font-medium">{booking.name}</TableCell>
                                        <TableCell>{booking.phone}</TableCell>
                                        <TableCell>{booking.date}</TableCell>
                                        <TableCell>{booking.time}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {booking.guests}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={statusColors[booking.status]}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                            {booking.notes}
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
                                                    <DropdownMenuItem>Edit Booking</DropdownMenuItem>
                                                    <DropdownMenuItem>Confirm</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        Cancel Booking
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Total Bookings: {bookings.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-3 text-sm">
                                1
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
