"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    BookOpen,
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
    FileText,
    MessageSquare,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const faqs = [
    {
        id: "1",
        question: "What are your business hours?",
        answer: "We are open Monday through Friday from 9:00 AM to 9:00 PM, Saturday from 10:00 AM to 10:00 PM, and Sunday from 11:00 AM to 8:00 PM.",
        category: "General",
    },
    {
        id: "2",
        question: "Do you offer delivery?",
        answer: "Yes, we offer delivery within a 5-mile radius. Delivery orders can be placed through our phone line or website with a minimum order of $20.",
        category: "Delivery",
    },
    {
        id: "3",
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, Apple Pay, Google Pay, and cash for in-person orders.",
        category: "Payment",
    },
    {
        id: "4",
        question: "Do you accommodate dietary restrictions?",
        answer: "Absolutely! We offer vegetarian, vegan, gluten-free, and allergen-friendly options. Please let us know about any dietary restrictions when ordering.",
        category: "Menu",
    },
    {
        id: "5",
        question: "How can I make a reservation?",
        answer: "Reservations can be made by calling us directly, through our AI phone assistant, or via our online booking system. We recommend booking at least 24 hours in advance for larger parties.",
        category: "Reservations",
    },
];

const businessInfo = {
    name: "Cortex Restaurant",
    phone: "+1 (555) 123-4567",
    email: "contact@cortex.restaurant",
    address: "123 Main Street, Downtown, NY 10001",
    website: "www.cortex.restaurant",
    description:
        "A modern dining experience featuring innovative cuisine and exceptional service. Our AI-powered phone system ensures every customer call is handled with care.",
};

export default function KnowledgeBasePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFaq, setExpandedFaq] = useState<string | null>("1");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-muted-foreground">
                        Manage FAQs and business information for your AI agent.
                    </p>
                </div>
                <Button className="gap-2 glow-sm">
                    <Plus className="h-4 w-4" />
                    Add Entry
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="faqs" className="space-y-6">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="faqs" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        FAQs
                    </TabsTrigger>
                    <TabsTrigger value="business" className="gap-2">
                        <Info className="h-4 w-4" />
                        Business Info
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Documents
                    </TabsTrigger>
                </TabsList>

                {/* FAQs Tab */}
                <TabsContent value="faqs" className="space-y-4">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* FAQ List */}
                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <Card key={faq.id} className="glass-card overflow-hidden">
                                <div
                                    className="cursor-pointer p-4 hover:bg-accent/30 transition-colors"
                                    onClick={() =>
                                        setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                                    }
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            {expandedFaq === faq.id ? (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            )}
                                            <div>
                                                <p className="font-medium">{faq.question}</p>
                                                {expandedFaq === faq.id && (
                                                    <p className="text-muted-foreground mt-2 text-sm">
                                                        {faq.answer}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className="flex items-center gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Badge variant="secondary">{faq.category}</Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Business Info Tab */}
                <TabsContent value="business">
                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Business Information
                                </CardTitle>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Business Name</p>
                                    <p className="font-medium">{businessInfo.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{businessInfo.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{businessInfo.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Website</p>
                                    <p className="font-medium">{businessInfo.website}</p>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="font-medium">{businessInfo.address}</p>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <p className="text-sm text-muted-foreground">Description</p>
                                    <p className="font-medium">{businessInfo.description}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents">
                    <Card className="glass-card">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No Documents Yet</h3>
                            <p className="text-muted-foreground text-center max-w-[400px] mb-4">
                                Upload documents like PDFs, menus, or guides for your AI agent to reference.
                            </p>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Upload Document
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
