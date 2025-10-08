// @/components/profile/addresses/address-card.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal,
    Truck,
    CreditCard,
    Star,
    Edit,
    Trash2,
    MapPin,
    Phone,
    Loader2,
} from 'lucide-react';
import { Address } from './types';

interface AddressCardProps {
    address: Address;
    onEdit: (address: Address) => void;
    onDelete: (addressId: string) => void;
    onSetDefault: (addressId: string) => void;
    deletingId?: string | null;
    settingDefaultId?: string | null;
}

export const AddressCard = ({
    address,
    onEdit,
    onDelete,
    onSetDefault,
    deletingId,
    settingDefaultId
}: AddressCardProps) => {
    const isDeleting = deletingId === address.id;
    const isSettingDefault = settingDefaultId === address.id;
    const isLoading = isDeleting || isSettingDefault;

    const getAddressTypeIcon = (type: string) => {
        return type === 'billing' ? CreditCard : Truck;
    };

    const getAddressTypeColor = (type: string) => {
        return type === 'billing'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    };

    const getAddressTypeLabel = (type: string) => {
        return type === 'billing' ? 'Billing Address' : 'Shipping Address';
    };

    const TypeIcon = getAddressTypeIcon(address.type);

    return (
        <Card className={`relative transition-all hover:shadow-md ${
            address.isDefault ? 'ring-2 ring-primary shadow-sm' : ''
        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getAddressTypeColor(address.type)}`}>
                            <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {getAddressTypeLabel(address.type)}
                                {address.isDefault && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                                        <Star className="w-3 h-3 mr-1" />
                                        Default
                                    </Badge>
                                )}
                                {isSettingDefault && (
                                    <Badge variant="outline" className="text-muted-foreground">
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Setting as default...
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                {address.fullName}
                            </CardDescription>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={isLoading}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MoreHorizontal className="w-4 h-4" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                onClick={() => onEdit(address)}
                                disabled={isLoading}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Address
                            </DropdownMenuItem>
                            {!address.isDefault && (
                                <DropdownMenuItem 
                                    onClick={() => onSetDefault(address.id)}
                                    disabled={isLoading}
                                >
                                    {isSettingDefault ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Setting as Default
                                        </>
                                    ) : (
                                        <>
                                            <Star className="w-4 h-4 mr-2" />
                                            Set as Default
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(address.id)}
                                className="text-destructive"
                                disabled={isLoading}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Address Details */}
                <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-medium">{address.line1}</p>
                        {address.line2 && (
                            <p className="text-muted-foreground">{address.line2}</p>
                        )}
                        <p>
                            {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-muted-foreground">{address.country}</p>
                    </div>
                </div>

                {/* Phone Number */}
                {address.phone && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm">{address.phone}</p>
                    </div>
                )}

                {/* Loading Overlay for visual feedback */}
                {isDeleting && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Deleting address...</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};