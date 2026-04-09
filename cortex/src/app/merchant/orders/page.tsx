"use client";

import { useState } from "react";
import {
    Search,
    Filter,
    ArrowUpDown,
    MoreHorizontal,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    Store,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Mock orders data - empty for now to show empty state
const orders: Array<{
    id: string;
    name: string;
    phone: string;
    amount: string;
    paymentStatus: string;
    createdAt: string;
    posStatus: string;
}> = [];

// For demo with data, uncomment:
// const orders = [
//   { id: "ORD-001", name: "John Doe", phone: "+1 (555) 123-4567", amount: "$45.99", paymentStatus: "paid", createdAt: "2024-12-28 10:30 AM", posStatus: "completed" },
//   { id: "ORD-002", name: "Jane Smith", phone: "+1 (555) 987-6543", amount: "$32.50", paymentStatus: "pending", createdAt: "2024-12-28 10:15 AM", posStatus: "processing" },
// ];

const paymentStatusColors: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const posStatusColors: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    processing: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [storeMode, setStoreMode] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Track Orders</h1>
                    <p className="text-muted-foreground">
                        Track customer orders made over the phone.
                    </p>
                </div>
                <Button
                    variant={storeMode ? "default" : "outline"}
                    className={storeMode ? "glow-sm gap-2" : "gap-2"}
                    onClick={() => setStoreMode(!storeMode)}
                >
                    <Store className="h-4 w-4" />
                    {storeMode ? "Active Store Mode" : "Store Mode"}
                </Button>
            </div>

            {/* Filters Card */}
            <Card className="glass-card">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <Select defaultValue="customer">
                            <SelectTrigger className="w-[180px] bg-background/50">
                                <SelectValue placeholder="Order Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Customer Orders</SelectItem>
                                <SelectItem value="phone">Phone Orders</SelectItem>
                                <SelectItem value="online">Online Orders</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex flex-1 gap-3 sm:justify-end">
                            <div className="relative flex-1 sm:max-w-[300px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search Orders ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-background/50"
                                />
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Table */}
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="font-semibold">Order Name</TableHead>
                                    <TableHead className="font-semibold">Phone Number</TableHead>
                                    <TableHead className="font-semibold">Amount</TableHead>
                                    <TableHead className="font-semibold">Payment Status</TableHead>
                                    <TableHead className="font-semibold">Created At</TableHead>
                                    <TableHead className="font-semibold">POS Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-[300px]">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
                                                    <ShoppingCart className="h-10 w-10 text-primary/60" />
                                                </div>
                                                <h3 className="text-lg font-semibold mb-1">No Results Found</h3>
                                                <p className="text-muted-foreground max-w-[300px]">
                                                    No results found for your search, try adjusting your filters ...
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-accent/50">
                                            <TableCell className="font-medium">{order.name}</TableCell>
                                            <TableCell>{order.phone}</TableCell>
                                            <TableCell>{order.amount}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={paymentStatusColors[order.paymentStatus]}
                                                >
                                                    {order.paymentStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{order.createdAt}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={posStatusColors[order.posStatus]}
                                                >
                                                    {order.posStatus}
                                                </Badge>
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
                                                        <DropdownMenuItem>Edit Order</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            Cancel Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Total Orders: {orders.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex h-8 min-w-8 items-center justify-center rounded-md border border-border px-3 text-sm">
                                {currentPage}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={orders.length === 0}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Select defaultValue="10">
                                <SelectTrigger className="h-8 w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
