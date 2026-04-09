"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    UtensilsCrossed,
    Edit,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronRight,
    DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const menuCategories = [
    {
        id: "1",
        name: "Appetizers",
        items: [
            { id: "1-1", name: "Spring Rolls", price: "$8.99", available: true },
            { id: "1-2", name: "Chicken Wings", price: "$12.99", available: true },
            { id: "1-3", name: "Soup of the Day", price: "$6.99", available: false },
        ],
    },
    {
        id: "2",
        name: "Main Courses",
        items: [
            { id: "2-1", name: "Grilled Salmon", price: "$24.99", available: true },
            { id: "2-2", name: "Ribeye Steak", price: "$32.99", available: true },
            { id: "2-3", name: "Pasta Primavera", price: "$18.99", available: true },
            { id: "2-4", name: "Chicken Parmesan", price: "$21.99", available: true },
        ],
    },
    {
        id: "3",
        name: "Desserts",
        items: [
            { id: "3-1", name: "Chocolate Cake", price: "$9.99", available: true },
            { id: "3-2", name: "Ice Cream Sundae", price: "$7.99", available: true },
        ],
    },
    {
        id: "4",
        name: "Beverages",
        items: [
            { id: "4-1", name: "Soft Drinks", price: "$2.99", available: true },
            { id: "4-2", name: "Fresh Juice", price: "$4.99", available: true },
            { id: "4-3", name: "Coffee", price: "$3.99", available: true },
        ],
    },
];

export default function MenusPage() {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(["1", "2"]);
    const [searchQuery, setSearchQuery] = useState("");

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Menus</h1>
                    <p className="text-muted-foreground">
                        Manage your menu items and categories.
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="gap-2 glow-sm">
                            <Plus className="h-4 w-4" />
                            Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                                Create a new menu category to organize your items.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-name">Category Name</Label>
                                <Input id="category-name" placeholder="e.g., Appetizers, Main Courses..." />
                            </div>
                            <Button className="w-full">Create Category</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Menu Categories */}
            <div className="space-y-4">
                {menuCategories.map((category) => (
                    <Card key={category.id} className="glass-card overflow-hidden">
                        <CardHeader
                            className="cursor-pointer hover:bg-accent/30 transition-colors"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                    {expandedCategories.includes(category.id) ? (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <CardTitle className="text-lg">{category.name}</CardTitle>
                                    <Badge variant="secondary">{category.items.length} items</Badge>
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <Plus className="h-3 w-3" />
                                        Add Item
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Category
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Category
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        {expandedCategories.includes(category.id) && (
                            <CardContent className="pt-0">
                                <div className="space-y-2">
                                    {category.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <DollarSign className="h-3 w-3" />
                                                        {item.price}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        item.available
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                                    }
                                                >
                                                    {item.available ? "Available" : "Unavailable"}
                                                </Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Edit Item</DropdownMenuItem>
                                                        <DropdownMenuItem>Toggle Availability</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            Delete Item
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
