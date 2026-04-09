"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Clock,
    TrendingUp,
    Bot,
    Users,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";

const stats = [
    {
        title: "Total Calls",
        value: "2,847",
        change: "+18.2%",
        icon: Phone,
        color: "from-violet-500 to-purple-600",
    },
    {
        title: "Answered by AI",
        value: "2,156",
        change: "+24.5%",
        icon: Bot,
        color: "from-cyan-500 to-blue-600",
    },
    {
        title: "Avg Handle Time",
        value: "3m 42s",
        change: "-12.3%",
        icon: Clock,
        color: "from-emerald-500 to-teal-600",
    },
    {
        title: "Customer Satisfaction",
        value: "94.2%",
        change: "+2.1%",
        icon: Users,
        color: "from-orange-500 to-amber-600",
    },
];

const callVolumeData = [
    { hour: "6AM", calls: 12 },
    { hour: "8AM", calls: 45 },
    { hour: "10AM", calls: 78 },
    { hour: "12PM", calls: 95 },
    { hour: "2PM", calls: 82 },
    { hour: "4PM", calls: 68 },
    { hour: "6PM", calls: 88 },
    { hour: "8PM", calls: 72 },
    { hour: "10PM", calls: 35 },
];

const weeklyData = [
    { day: "Mon", answered: 320, missed: 15, ai: 280 },
    { day: "Tue", answered: 285, missed: 22, ai: 245 },
    { day: "Wed", answered: 340, missed: 18, ai: 295 },
    { day: "Thu", answered: 380, missed: 12, ai: 340 },
    { day: "Fri", answered: 420, missed: 25, ai: 365 },
    { day: "Sat", answered: 390, missed: 20, ai: 335 },
    { day: "Sun", answered: 250, missed: 10, ai: 220 },
];

const recentCalls = [
    { type: "incoming", number: "+1 (555) 123-4567", duration: "4:32", status: "answered", handler: "AI" },
    { type: "incoming", number: "+1 (555) 987-6543", duration: "2:15", status: "answered", handler: "AI" },
    { type: "missed", number: "+1 (555) 456-7890", duration: "-", status: "missed", handler: "-" },
    { type: "outgoing", number: "+1 (555) 321-0987", duration: "1:48", status: "completed", handler: "Staff" },
    { type: "incoming", number: "+1 (555) 654-3210", duration: "5:22", status: "answered", handler: "AI" },
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

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Monitor your call performance and AI agent metrics.
                </p>
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

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Call Volume Chart */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Call Volume by Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={callVolumeData}>
                                    <defs>
                                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="hour" stroke="#71717a" fontSize={12} />
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
                                        dataKey="calls"
                                        stroke="#8b5cf6"
                                        fillOpacity={1}
                                        fill="url(#colorCalls)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Performance */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Weekly Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                                    <YAxis stroke="#71717a" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid #27272a",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="ai" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="answered" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Calls */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Recent Calls</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentCalls.map((call, index) => {
                            const Icon = callTypeIcons[call.type as keyof typeof callTypeIcons];
                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${call.type === "missed" ? "bg-red-500/10" : "bg-primary/10"
                                            }`}>
                                            <Icon className={`h-5 w-5 ${call.type === "missed" ? "text-red-500" : "text-primary"
                                                }`} />
                                        </div>
                                        <div>
                                            <p className="font-medium">{call.number}</p>
                                            <p className="text-sm text-muted-foreground">Duration: {call.duration}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={statusColors[call.status]}>
                                            {call.status}
                                        </Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                            {call.handler}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
