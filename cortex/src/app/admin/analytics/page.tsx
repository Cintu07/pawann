"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Users,
    Phone,
    TrendingUp,
    Building2,
    DollarSign,
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
        title: "Total Clients",
        value: "156",
        change: "+12",
        description: "this month",
        icon: Building2,
        color: "from-red-500 to-orange-500",
    },
    {
        title: "Active Users",
        value: "1,234",
        change: "+8.5%",
        description: "vs last month",
        icon: Users,
        color: "from-blue-500 to-cyan-500",
    },
    {
        title: "Total Calls",
        value: "45.2K",
        change: "+24%",
        description: "this month",
        icon: Phone,
        color: "from-emerald-500 to-teal-500",
    },
    {
        title: "Revenue",
        value: "$125K",
        change: "+18.2%",
        description: "vs last month",
        icon: DollarSign,
        color: "from-violet-500 to-purple-500",
    },
];

const clientGrowthData = [
    { month: "Jul", clients: 85 },
    { month: "Aug", clients: 98 },
    { month: "Sep", clients: 112 },
    { month: "Oct", clients: 128 },
    { month: "Nov", clients: 142 },
    { month: "Dec", clients: 156 },
];

const callVolumeData = [
    { month: "Jul", calls: 28000, aiHandled: 24000 },
    { month: "Aug", calls: 32000, aiHandled: 28000 },
    { month: "Sep", calls: 35000, aiHandled: 31000 },
    { month: "Oct", calls: 38000, aiHandled: 34000 },
    { month: "Nov", calls: 42000, aiHandled: 38000 },
    { month: "Dec", calls: 45200, aiHandled: 41000 },
];

const topClients = [
    { name: "Downtown Bistro", calls: 2450, revenue: "$8,500" },
    { name: "Pizza Palace", calls: 1890, revenue: "$6,200" },
    { name: "TechCorp Inc", calls: 1650, revenue: "$5,800" },
    { name: "Acme Corp", calls: 1420, revenue: "$4,900" },
    { name: "Restaurant XYZ", calls: 1280, revenue: "$4,200" },
];

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                    <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">
                        Platform-wide performance metrics and insights.
                    </p>
                </div>
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
                                        <span className="text-xs text-muted-foreground">
                                            {stat.description}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                                >
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Client Growth */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Client Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={clientGrowthData}>
                                    <defs>
                                        <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
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
                                        dataKey="clients"
                                        stroke="#f97316"
                                        fillOpacity={1}
                                        fill="url(#colorClients)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Call Volume */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Call Volume (Monthly)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={callVolumeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                                    <YAxis stroke="#71717a" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid #27272a",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="calls" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="aiHandled" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Clients */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Top Performing Clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topClients.map((client, index) => (
                            <div
                                key={client.name}
                                className="flex items-center justify-between p-4 rounded-lg bg-accent/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{client.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {client.calls.toLocaleString()} calls this month
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                                    {client.revenue}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
