"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Settings,
    Play,
    Pause,
    Phone,
    MessageSquare,
    Volume2,
    Edit,
} from "lucide-react";

const voiceAgents = [
    {
        id: "1",
        name: "Primary Voice Agent",
        status: "active",
        voiceId: "alloy",
        calls_today: 156,
        avg_duration: "3:42",
        description: "Main phone line handler for orders and reservations",
    },
    {
        id: "2",
        name: "After Hours Agent",
        status: "scheduled",
        voiceId: "nova",
        calls_today: 45,
        avg_duration: "2:15",
        description: "Handles calls outside business hours",
    },
];

const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    inactive: "bg-muted text-muted-foreground border-muted",
};

export default function VoiceAgentsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Voice Agents</h1>
                    <p className="text-muted-foreground">
                        Manage your AI voice agents and their configurations.
                    </p>
                </div>
                <Button className="gap-2 glow-sm">
                    <Sparkles className="h-4 w-4" />
                    Add Agent
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">201</p>
                                <p className="text-xs text-muted-foreground">Calls Handled Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                <MessageSquare className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">94.5%</p>
                                <p className="text-xs text-muted-foreground">Success Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <Volume2 className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">2</p>
                                <p className="text-xs text-muted-foreground">Active Agents</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Voice Agents List */}
            <div className="space-y-4">
                {voiceAgents.map((agent) => (
                    <Card key={agent.id} className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary shadow-lg">
                                        <Sparkles className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <CardTitle>{agent.name}</CardTitle>
                                            <Badge variant="outline" className={statusColors[agent.status]}>
                                                {agent.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {agent.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {agent.status === "active" ? (
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Pause className="h-4 w-4" />
                                            Pause
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Play className="h-4 w-4" />
                                            Activate
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Settings className="h-4 w-4" />
                                        Configure
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="p-4 rounded-lg bg-accent/30">
                                    <p className="text-sm text-muted-foreground">Voice ID</p>
                                    <p className="font-medium mt-1 capitalize">{agent.voiceId}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-accent/30">
                                    <p className="text-sm text-muted-foreground">Calls Today</p>
                                    <p className="font-medium mt-1">{agent.calls_today}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-accent/30">
                                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                                    <p className="font-medium mt-1">{agent.avg_duration}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-accent/30 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Quick Actions</p>
                                        <p className="font-medium mt-1">Test Agent</p>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
