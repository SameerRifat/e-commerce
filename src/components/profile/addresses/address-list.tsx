// @/components/profile/addresses/address-list.tsx

'use client';

import { AddressCard } from './address-card';
import { EmptyState } from './empty-state';
import { Address } from './types';

interface AddressListProps {
    addresses: Address[];
    onEdit: (address: Address) => void;
    onDelete: (addressId: string) => void;
    onSetDefault: (addressId: string) => void;
    onAddAddress: () => void;
    deletingId?: string | null;
    settingDefaultId?: string | null;
}

export const AddressList = ({
    addresses,
    onEdit,
    onDelete,
    onSetDefault,
    onAddAddress,
    deletingId,
    settingDefaultId
}: AddressListProps) => {
    if (addresses.length === 0) {
        return <EmptyState onAddAddress={onAddAddress} />;
    }

    // Separate addresses by type for better organization
    const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
    const billingAddresses = addresses.filter(addr => addr.type === 'billing');

    return (
        <div className="space-y-8">
            {/* Shipping Addresses */}
            {shippingAddresses.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Shipping Addresses
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {shippingAddresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onSetDefault={onSetDefault}
                                deletingId={deletingId}
                                settingDefaultId={settingDefaultId}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Billing Addresses */}
            {billingAddresses.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Billing Addresses
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {billingAddresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onSetDefault={onSetDefault}
                                deletingId={deletingId}
                                settingDefaultId={settingDefaultId}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};