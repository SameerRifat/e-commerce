// src/components/profile/email-notifications-section.tsx
'use client';

import { Bell, Mail, Shield, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function EmailNotificationsSection() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-5 w-5" />
                    Email Notifications
                </CardTitle>
                <CardDescription>Notification preferences (coming soon)</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Badge variant="outline" className="w-fit">
                    Backend Integration Pending
                </Badge>

                <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-3">
                    {/* Order Updates */}
                    <div className="flex items-start gap-2">
                        <Zap className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Order Updates</p>
                            <p className="text-xs text-muted-foreground">
                                Notifications about your order status
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Security Alerts */}
                    <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Security Alerts</p>
                            <p className="text-xs text-muted-foreground">
                                Important account security notifications
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Marketing Emails */}
                    <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Marketing Emails</p>
                            <p className="text-xs text-muted-foreground">
                                Promotional offers and product updates
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    Notification preferences are currently static. Full customization will be available soon.
                </p>
            </CardContent>
        </Card>
    );
}