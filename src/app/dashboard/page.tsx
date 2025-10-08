"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Package, Layers, Sparkles, Boxes, Palette, Images } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/dashboard/page-header';

const Dashboard = () => {
  const router = useRouter();

  const quickActions = [
    {
      title: "Add Product",
      description: "Create a new cosmetics product",
      icon: Package,
      action: () => router.push("/dashboard/products/new"),
      color: "bg-blue-500",
    },
    {
      title: "Manage Categories",
      description: "Organize product categories",
      icon: Layers,
      action: () => router.push("/dashboard/categories"),
      color: "bg-green-500",
    },
    {
      title: "Add Brand",
      description: "Create a new brand",
      icon: Sparkles,
      action: () => router.push("/dashboard/brands/new"),
      color: "bg-purple-500",
    },
    {
      title: "Create Collection",
      description: "Curate themed collections",
      icon: Boxes,
      action: () => router.push("/dashboard/collections/new"),
      color: "bg-orange-500",
    },
    {
      title: "Manage Colors",
      description: "Add color attributes",
      icon: Palette,
      action: () => router.push("/dashboard/attributes/colors"),
      color: "bg-pink-500",
    },
    {
      title: "Upload Media",
      description: "Add product images",
      icon: Images,
      action: () => router.push("/dashboard/media/upload"),
      color: "bg-indigo-500",
    },
  ];

  const stats = [
    { label: "Total Products", value: "24", change: "+3 this week" },
    { label: "Product Variants", value: "89", change: "+12 this week" },
    { label: "Categories", value: "8", change: "No change" },
    { label: "Brands", value: "6", change: "+1 this week" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome to your cosmetics product management dashboard"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">New product &quot;Luxe Matte Lipstick&quot; was created</span>
                <span className="text-gray-400 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Brand &quot;Glamour Beauty&quot; was updated</span>
                <span className="text-gray-400 ml-auto">1 day ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">New collection &quot;Summer Glow 2024&quot; was created</span>
                <span className="text-gray-400 ml-auto">2 days ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">Category &quot;Skincare&quot; was added</span>
                <span className="text-gray-400 ml-auto">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;