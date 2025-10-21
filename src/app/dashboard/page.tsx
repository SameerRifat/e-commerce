// src/app/dashboard/page.tsx
import React from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  Sparkles,
  Boxes,
  Palette,
  Images,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/dashboard/page-header';
import { getDashboardStats, getRecentDashboardOrders } from '@/lib/actions/dashboard/dashboard-stats';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Status badge color mapping
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  out_for_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
} as const;

// Format relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Calculate percentage change
function calculatePercentageChange(current: number, previous: number): {
  percentage: number;
  trend: 'up' | 'down' | 'neutral';
  label: string;
} {
  if (previous === 0) {
    if (current === 0) return { percentage: 0, trend: 'neutral', label: 'No change' };
    return { percentage: 100, trend: 'up', label: '+100%' };
  }

  const change = ((current - previous) / previous) * 100;
  const roundedChange = Math.round(change * 10) / 10;

  return {
    percentage: Math.abs(roundedChange),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    label: change > 0 ? `+${roundedChange}%` : change < 0 ? `${roundedChange}%` : '0%',
  };
}

export default async function DashboardPage() {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in?redirectTo=/dashboard");
  }

  // Fetch data in parallel
  const [statsResult, ordersResult] = await Promise.all([
    getDashboardStats(),
    getRecentDashboardOrders(5),
  ]);

  // Handle errors gracefully
  if (!statsResult.success || !statsResult.stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Failed to load dashboard</h2>
          <p className="text-gray-600 mt-2">{statsResult.error || 'Please try again later.'}</p>
        </div>
      </div>
    );
  }

  const stats = statsResult.stats;
  const recentOrders = ordersResult.orders || [];

  // Calculate revenue trend
  const revenueTrend = calculatePercentageChange(stats.weeklyRevenue, stats.previousWeekRevenue);

  const quickActions = [
    {
      title: "Add Product",
      description: "Create a new cosmetics product",
      icon: Package,
      href: "/dashboard/products/new",
      color: "bg-blue-500",
    },
    {
      title: "Manage Categories",
      description: "Organize product categories",
      icon: Layers,
      href: "/dashboard/categories",
      color: "bg-green-500",
    },
    {
      title: "Add Brand",
      description: "Create a new brand",
      icon: Sparkles,
      href: "/dashboard/brands/new",
      color: "bg-purple-500",
    },
    {
      title: "Create Collection",
      description: "Curate themed collections",
      icon: Boxes,
      href: "/dashboard/collections/new",
      color: "bg-orange-500",
    },
    {
      title: "Manage Colors",
      description: "Add color attributes",
      icon: Palette,
      href: "/dashboard/attributes/colors",
      color: "bg-pink-500",
    },
    {
      title: "Upload Media",
      description: "Add product images",
      icon: Images,
      href: "/dashboard/media/upload",
      color: "bg-indigo-500",
    },
  ];

  const dashboardStats = [
    {
      label: "Total Products",
      value: stats.totalProducts.toString(),
      change: stats.recentProducts > 0 ? `+${stats.recentProducts} this week` : "No change",
      icon: Package,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      href: "/dashboard/products",
    },
    {
      label: "Active Orders",
      value: stats.activeOrders?.toString(),
      sublabel: "Pending + Processing",
      change: stats.todayOrders > 0 ? `${stats.todayOrders} new today` : "No new orders",
      icon: ShoppingCart,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
      href: "/dashboard/orders?status=pending",
      highlight: stats.activeOrders > 0,
    },
    {
      label: "Categories",
      value: stats.totalCategories.toString(),
      change: "Active categories",
      icon: Layers,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      href: "/dashboard/categories",
    },
    {
      label: "Brands",
      value: stats.totalBrands.toString(),
      change: stats.recentBrands > 0 ? `${stats.recentBrands} with new products` : "No change",
      icon: Sparkles,
      iconColor: "text-pink-600",
      iconBg: "bg-pink-100",
      href: "/dashboard/brands",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome to your cosmetics product management dashboard"
      />

      {/* Alert for Active Orders */}
      {stats.activeOrders > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            You have <strong>{stats.activeOrders} active order{stats.activeOrders !== 1 ? 's' : ''}</strong> that need attention.{' '}
            <Link href="/dashboard/orders?status=pending" className="underline font-semibold hover:text-orange-700">
              View orders →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Link key={stat.label} href={stat.href || '#'}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${stat.highlight ? 'ring-2 ring-orange-200' : ''}`}>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  {stat.highlight && (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                      Action Required
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                {stat.sublabel && (
                  <div className="text-xs text-gray-500 mt-0.5">{stat.sublabel}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">{stat.change}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Revenue Highlight Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4 sm:p-6">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-sm text-gray-600">Weekly Revenue</div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/orders" className="text-xs">
                  Details
                  <TrendingUp className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="pl-12">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(stats.weeklyRevenue)}
              </div>
              <div className="flex items-center gap-2">
                {revenueTrend.trend === 'up' && (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {revenueTrend.label} from last week
                    </span>
                  </>
                )}
                {revenueTrend.trend === 'down' && (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">
                      {revenueTrend.label} from last week
                    </span>
                  </>
                )}
                {revenueTrend.trend === 'neutral' && (
                  <span className="text-sm text-gray-600">No change from last week</span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-lg bg-green-100">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Weekly Revenue</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.weeklyRevenue)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {revenueTrend.trend === 'up' && (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        {revenueTrend.label} from last week
                      </span>
                    </>
                  )}
                  {revenueTrend.trend === 'down' && (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {revenueTrend.label} from last week
                      </span>
                    </>
                  )}
                  {revenueTrend.trend === 'neutral' && (
                    <span className="text-sm text-gray-600">No change from last week</span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/orders">
                View Details
                <TrendingUp className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/orders">
              <span className="hidden sm:inline">View All Orders</span>
              <span className="sm:hidden">View All</span>
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-3 sm:p-6">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="block p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors border border-border hover:border-gray-200"
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              Order #{order.orderNumber}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs flex-shrink-0 ${statusColors[order.status]}`}
                            >
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {order.customerName}
                          </div>
                          {order.shippingCity && (
                            <div className="text-xs text-gray-500 mb-2">
                              {order.shippingCity} • {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pl-13">
                        <div className="text-xs text-gray-500">
                          {getRelativeTime(order.createdAt)}
                        </div>
                        <div className="text-base font-semibold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusColors[order.status]}`}
                          >
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{order.customerName}</span>
                          {order.shippingCity && (
                            <>
                              <span>•</span>
                              <span>{order.shippingCity}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getRelativeTime(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}