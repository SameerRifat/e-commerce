// src/components/dashboard/app-sidebar.tsx
"use client"

import * as React from "react"
import { Package, Palette, Layers, Images, Command, Boxes, Sparkles, LifeBuoy, Send, Frame, PieChart, ShoppingBag} from "lucide-react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"

const data = {
    user: {
        name: "Admin",
        email: "admin@example.com",
        avatar: "/avatars/admin.jpg",
    },
    navMain: [
        {
            title: "Products",
            url: "/dashboard/products",
            icon: Package,
            isActive: true,
            items: [
                {
                    title: "All Products",
                    url: "/dashboard/products",
                },
                {
                    title: "Create Product",
                    url: "/dashboard/products/new",
                },
                {
                    title: "Manage Variants",
                    url: "/dashboard/products/variants",
                },
            ],
        },
        {
            title: "Orders",
            url: "/dashboard/orders",
            icon: ShoppingBag,
            items: [
                {
                    title: "All Orders",
                    url: "/dashboard/orders",
                },
                {
                    title: "Pending",
                    url: "/dashboard/orders?status=pending",
                },
                {
                    title: "Processing",
                    url: "/dashboard/orders?status=processing",
                },
                {
                    title: "Shipped",
                    url: "/dashboard/orders?status=shipped",
                },
            ],
        },
        {
            title: "Categories",
            url: "/dashboard/categories",
            icon: Layers,
            items: [
                {
                    title: "All Categories",
                    url: "/dashboard/categories",
                },
                {
                    title: "Add Category",
                    url: "/dashboard/categories/new",
                },
            ],
        },
        {
            title: "Brands",
            url: "/dashboard/brands",
            icon: Sparkles,
            items: [
                {
                    title: "All Brands",
                    url: "/dashboard/brands",
                },
                {
                    title: "Add Brand",
                    url: "/dashboard/brands/new",
                },
            ],
        },
        {
            title: "Collections",
            url: "/dashboard/collections",
            icon: Boxes,
            items: [
                {
                    title: "All Collections",
                    url: "/dashboard/collections",
                },
                {
                    title: "Add Collection",
                    url: "/dashboard/collections/new",
                },
            ],
        },
        {
            title: "Attributes",
            url: "/dashboard/attributes",
            icon: Palette,
            items: [
                {
                    title: "Colors",
                    url: "/dashboard/attributes/colors",
                },
                {
                    title: "Sizes",
                    url: "/dashboard/attributes/sizes",
                },
            ],
        },
        {
            title: "Media",
            url: "/dashboard/media",
            icon: Images,
            items: [
                {
                    title: "Image Library",
                    url: "/dashboard/media",
                },
                {
                    title: "Upload Images",
                    url: "/dashboard/media/upload",
                },
            ],
        },
    ],
    navSecondary: [
        {
            title: "Support",
            url: "#",
            icon: LifeBuoy,
        },
        {
            title: "Feedback",
            url: "#",
            icon: Send,
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Cosmetics Dashboard</span>
                                    <span className="truncate text-xs">Product Management</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                SidebarFooter
            </SidebarFooter>
        </Sidebar>
    )
}
