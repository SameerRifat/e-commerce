// src/components/profile/account-summary-section.tsx
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SelectUser } from '@/lib/db/schema';

interface AccountSummarySectionProps {
    user: SelectUser;
}

export default function AccountSummarySection({
    user,
}: AccountSummarySectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Account Summary</CardTitle>
                <CardDescription>Your account details at a glance</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Member Since */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>

                {/* Account Status */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Account Status</p>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                        Active
                    </Badge>
                </div>

                {/* Email Verification */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Email Status</p>
                    <Badge
                        className={`mt-1 ${user.emailVerified
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                            }`}
                    >
                        {user.emailVerified ? 'Verified' : 'Pending'}
                    </Badge>
                </div>

                {/* Last Updated */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(user.updatedAt)}</p>
                </div>

                {/* Account Role */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground">Account Type</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                        {user.role}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}