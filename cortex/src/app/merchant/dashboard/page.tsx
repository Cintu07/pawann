"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShoppingCart,
    Phone,
    Calendar,
    TrendingUp,
    Clock,
    DollarSign,
    Users,
    Sparkles,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const stats = [
    {
        title: "Total Orders",
        value: "1,234",
        change: "+12.5%",
        trend: "up",
        icon: ShoppingCart,
        color: "from-violet-500 to-purple-600",
    },
    {
        title: "Phone Calls",
        value: "856",
        change: "+8.2%",
        trend: "up",
        icon: Phone,
        color: "from-blue-500 to-cyan-600",
    },
    {
        title: "Bookings",
        value: "342",
        change: "+15.3%",
        trend: "up",
        icon: Calendar,
        color: "from-emerald-500 to-teal-600",
    },
    {
        title: "Revenue",
        value: "$45,231",
        change: "+22.1%",
        trend: "up",
        icon: DollarSign,
        color: "from-orange-500 to-amber-600",
    },
];

const chartData = [
    { name: "Mon", orders: 45, calls: 32, bookings: 12 },
    { name: "Tue", orders: 52, calls: 28, bookings: 18 },
    { name: "Wed", orders: 48, calls: 35, bookings: 15 },
    { name: "Thu", orders: 70, calls: 42, bookings: 22 },
    { name: "Fri", orders: 85, calls: 55, bookings: 28 },
    { name: "Sat", orders: 92, calls: 48, bookings: 35 },
    { name: "Sun", orders: 78, calls: 38, bookings: 25 },
];

const recentActivity = [
    { type: "order", message: "New order #1234 received", time: "2 min ago", icon: ShoppingCart },
    { type: "call", message: "Incoming call answered by AI", time: "5 min ago", icon: Phone },
    { type: "booking", message: "New reservation for 4 guests", time: "12 min ago", icon: Calendar },
    { type: "order", message: "Order #1233 completed", time: "18 min ago", icon: ShoppingCart },
    { type: "call", message: "Missed call from +1 (555) 123-4567", time: "25 min ago", icon: Phone },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here&apos;s what&apos;s happening with your store.
                    </p>
                </div>
                <Badge variant="outline" className="gap-2 px-3 py-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Active
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                                        <span className="text-xs text-emerald-500">{stat.change}</span>
                                        <span className="text-xs text-muted-foreground">vs last week</span>
                                    </div>
                                </div>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Chart */}
                <Card className="glass-card lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Weekly Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                                    <YAxis stroke="#71717a" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid #27272a",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="orders"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorOrders)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="calls"
                                        stroke="#06b6d4"
                                        fillOpacity={1}
                                        fill="url(#colorCalls)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                        <activity.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{activity.message}</p>
                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
