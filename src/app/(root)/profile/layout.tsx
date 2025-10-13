// app/(main)/profile/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Package,
    MapPin,
    Heart,
    Headphones
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const profileTabs = [
    {
        value: 'overview',
        label: 'Account Overview',
        icon: User,
        href: '/profile',
        description: 'Personal information and account summary'
    },
    {
        value: 'orders',
        label: 'My Orders',
        icon: Package,
        href: '/profile/orders',
        description: 'View and track your orders'
    },
    {
        value: 'addresses',
        label: 'Addresses',
        icon: MapPin,
        href: '/profile/addresses',
        description: 'Manage shipping and billing addresses'
    },
    {
        value: 'wishlist',
        label: 'Saved Items',
        icon: Heart,
        href: '/profile/wishlist',
        description: 'Your favorite fragrances'
    },
];


export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Determine active tab based on current path
    const getActiveTab = () => {
        if (pathname === '/profile') return 'overview';
        const pathSegments = pathname.split('/');
        return pathSegments[pathSegments.length - 1] || 'overview';
    };

    const activeTab = getActiveTab();

    return (
        <div className="min-h-screen mt-20">
            <div className="custom_container py-8">

                {/* Profile Layout with Vertical Tabs */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-80 lg:shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold mb-6 text-foreground">Account Menu</h2>

                            <Tabs value={activeTab} orientation="vertical" className="w-full">
                                <TabsList
                                    className="flex flex-col items-stretch space-y-1 bg-transparent h-auto p-0"
                                >
                                    {profileTabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.value;

                                        return (
                                            <TabsTrigger
                                                key={tab.value}
                                                value={tab.value}
                                                asChild
                                                className={`flex items-center justify-start w-full p-3 rounded-md transition-all duration-200`}
                                            >
                                                <Link href={tab.href} className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="w-4 h-4" />
                                                        <div className="text-left">
                                                            <div className="font-medium text-sm">{tab.label}</div>
                                                            <div className="text-xs opacity-75 hidden sm:block">
                                                                {tab.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Help Section */}
                        <div className="mt-8">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Headphones className="w-4 h-4 text-orange-600" />
                                    <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                                        Need Help?
                                    </h3>
                                </div>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                                    Our customer support team is here to help you with any questions.
                                </p>
                                <Link
                                    href="/profile/support"
                                    className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                >
                                    Contact Support →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Vertical Separator */}
                    <div className="hidden lg:block">
                        <Separator orientation="vertical" className="h-full" />
                    </div>

                    {/* Horizontal Separator for mobile */}
                    <div className="lg:hidden">
                        <Separator orientation="horizontal" />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}