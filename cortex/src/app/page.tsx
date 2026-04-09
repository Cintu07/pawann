import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, Users, Phone, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-2xl glow animate-glow">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Hero Text */}
        <h1 className="text-5xl font-bold mb-4">
          Welcome to{" "}
          <span className="gradient-text">Cortex</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Your AI-powered voice agent platform for managing orders, bookings, and customer interactions.
        </p>

        {/* Portal Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Link href="/merchant/dashboard">
            <Card className="glass-card hover:border-primary/50 transition-all cursor-pointer group">
              <CardContent className="p-8 text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary shadow-lg mb-4 group-hover:glow transition-all">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Merchant Portal</h2>
                <p className="text-muted-foreground mb-4">
                  Manage your store, orders, phone calls, menus, and AI voice agents.
                </p>
                <div className="flex items-center text-primary font-medium">
                  Enter Dashboard
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/accounts">
            <Card className="glass-card hover:border-orange-500/50 transition-all cursor-pointer group">
              <CardContent className="p-8 text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg mb-4 group-hover:shadow-orange-500/20 transition-all">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Admin Portal</h2>
                <p className="text-muted-foreground mb-4">
                  Manage client accounts, support tickets, analytics, and system monitoring.
                </p>
                <div className="flex items-center text-orange-400 font-medium">
                  Enter Admin
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">45.2K</p>
                <p className="text-sm text-muted-foreground">Calls Handled</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <BarChart3 className="h-6 w-6 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold">94.5%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground mt-12">
          © 2024 Cortex AI. Powered by advanced voice technology.
        </p>
      </div>
    </div>
  );
}
