"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    Server,
    Cpu,
    HardDrive,
    Wifi,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const systemStatus = [
    {
        name: "API Server",
        status: "operational",
        uptime: "99.98%",
        latency: "45ms",
        icon: Server,
    },
    {
        name: "Voice Processing",
        status: "operational",
        uptime: "99.95%",
        latency: "120ms",
        icon: Cpu,
    },
    {
        name: "Database",
        status: "operational",
        uptime: "99.99%",
        latency: "12ms",
        icon: HardDrive,
    },
    {
        name: "Phone Network",
        status: "degraded",
        uptime: "98.5%",
        latency: "85ms",
        icon: Wifi,
    },
];

const recentIncidents = [
    {
        id: "INC-001",
        title: "Phone network latency spike",
        status: "investigating",
        time: "15 min ago",
        impact: "minor",
    },
    {
        id: "INC-002",
        title: "API timeout errors",
        status: "resolved",
        time: "2 hours ago",
        impact: "none",
    },
    {
        id: "INC-003",
        title: "Database maintenance completed",
        status: "resolved",
        time: "1 day ago",
        impact: "none",
    },
];

const statusColors: Record<string, string> = {
    operational: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    degraded: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    down: "bg-red-500/10 text-red-400 border-red-500/20",
};

const incidentStatusColors: Record<string, string> = {
    investigating: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    identified: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    monitoring: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusIcons = {
    operational: CheckCircle2,
    degraded: AlertTriangle,
    down: XCircle,
};

export default function MonitoringPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
                    <p className="text-muted-foreground">
                        System health and infrastructure status.
                    </p>
                </div>
            </div>

            {/* Overall Status */}
            <Card className="glass-card border-emerald-500/20">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">All Systems Operational</h2>
                            <p className="text-muted-foreground">
                                Last updated: Just now • Next check in 30 seconds
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Components */}
            <div className="grid gap-4 md:grid-cols-2">
                {systemStatus.map((system) => {
                    const StatusIcon = statusIcons[system.status as keyof typeof statusIcons];
                    return (
                        <Card key={system.name} className="glass-card">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <system.icon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{system.name}</p>
                                            <Badge
                                                variant="outline"
                                                className={statusColors[system.status]}
                                            >
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {system.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Uptime</span>
                                        <span className="font-medium">{system.uptime}</span>
                                    </div>
                                    <Progress
                                        value={parseFloat(system.uptime)}
                                        className="h-2 bg-muted"
                                    />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Latency</span>
                                        <span className="font-medium">{system.latency}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Resource Usage */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Resource Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">CPU Usage</span>
                                <span className="font-medium">42%</span>
                            </div>
                            <Progress value={42} className="h-3 bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Memory</span>
                                <span className="font-medium">68%</span>
                            </div>
                            <Progress value={68} className="h-3 bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Storage</span>
                                <span className="font-medium">54%</span>
                            </div>
                            <Progress value={54} className="h-3 bg-muted" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Recent Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentIncidents.map((incident) => (
                            <div
                                key={incident.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-accent/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${incident.status === "resolved"
                                                ? "bg-emerald-500/10"
                                                : "bg-amber-500/10"
                                            }`}
                                    >
                                        {incident.status === "resolved" ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{incident.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {incident.id} • {incident.time}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={incidentStatusColors[incident.status]}
                                >
                                    {incident.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
