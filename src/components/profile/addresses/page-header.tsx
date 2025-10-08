// @/components/profile/addresses/page-header.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
    onAddAddress: () => void;
}

export const PageHeader = ({ onAddAddress }: PageHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Address Book</h2>
                <p className="text-muted-foreground">Manage your shipping and billing addresses</p>
            </div>

            <Button onClick={onAddAddress}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
            </Button>
        </div>
    );
};