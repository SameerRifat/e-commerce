// @/components/profile/addresses/page-header.tsx

'use client';

import PageHeader from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddressesPageHeaderProps {
    onAddAddress: () => void;
}

export const AddressesPageHeader = ({ onAddAddress }: AddressesPageHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
                <PageHeader
                    title="Address Book"
                    subtitle="Manage your shipping and billing addresses"
                />
            </div>

            <Button onClick={onAddAddress}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
            </Button>
        </div>
    );
};