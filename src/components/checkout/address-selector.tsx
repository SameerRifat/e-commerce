// src/components/checkout/address-selector.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Home, 
  Building, 
  Loader2,
} from 'lucide-react';
import { Address } from '@/components/profile/addresses/types';
import { AddressForm } from '@/components/profile/addresses/address-form';
import { useAddressDialog } from '@/components/profile/addresses/hooks';
import { createAddress, updateAddress } from '@/lib/actions/address-management';
import { AddressFormValues } from '@/lib/validations/address-validation';
import { toast } from 'sonner';

interface AddressSelectorProps {
  addresses: Address[];
  selectedShippingAddressId?: string;
  selectedBillingAddressId?: string;
  onShippingAddressChange: (addressId: string) => void;
  onBillingAddressChange: (addressId: string) => void;
  onUseSameAddressChange: (useSame: boolean) => void;
  useSameAddress: boolean;
  disabled?: boolean;
  onAddressesChange?: () => void | Promise<void>;
  isRefreshing?: boolean;
  errors?: {
    shippingAddressId?: string;
    billingAddressId?: string;
  };
}

export function AddressSelector({
  addresses,
  selectedShippingAddressId,
  selectedBillingAddressId,
  onShippingAddressChange,
  onBillingAddressChange,
  onUseSameAddressChange,
  useSameAddress,
  disabled = false,
  onAddressesChange,
  isRefreshing = false,
  errors = {},
}: AddressSelectorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressType, setAddressType] = useState<'shipping' | 'billing'>('shipping');

  const {
    showDialog,
    setShowDialog,
    editingAddress,
    formValues,
    openAddDialog,
    openEditDialog,
    closeDialog,
    isEditing
  } = useAddressDialog();

  const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
  const billingAddresses = addresses.filter(addr => addr.type === 'billing');

  const formatAddress = (address: Address) => {
    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state}`,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleAddAddress = useCallback((type: 'shipping' | 'billing') => {
    setAddressType(type);
    openAddDialog();
  }, [openAddDialog]);

  const handleEditAddress = useCallback((address: Address) => {
    setAddressType(address.type);
    openEditDialog(address);
  }, [openEditDialog]);

  const handleAddressFormSubmit = useCallback(async (data: AddressFormValues) => {
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (isEditing && editingAddress) {
        result = await updateAddress(editingAddress.id, data);
        
        if (result.success) {
          toast.success('Address updated successfully');
          closeDialog();
          
          if (onAddressesChange) {
            await onAddressesChange();
          }
        } else {
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, errors]) => {
              toast.error(`${field}: ${errors.join(', ')}`);
            });
          } else {
            toast.error(result.error || 'Failed to update address');
          }
        }
      } else {
        result = await createAddress(data);
        
        if (result.success && result.data) {
          toast.success('Address added successfully');
          closeDialog();
          
          if (onAddressesChange) {
            await onAddressesChange();
          }
          
          // Auto-select newly created address
          if (data.type === 'shipping') {
            onShippingAddressChange(result.data.addressId);
          } else if (data.type === 'billing') {
            onBillingAddressChange(result.data.addressId);
          }
        } else {
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, errors]) => {
              toast.error(`${field}: ${errors.join(', ')}`);
            });
          } else {
            toast.error(result.error || 'Failed to create address');
          }
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Address submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditing, editingAddress, onAddressesChange, closeDialog, onShippingAddressChange, onBillingAddressChange]);

  const getFormDefaultValues = useCallback(() => {
    if (editingAddress) {
      return formValues;
    }
    return {
      ...formValues,
      type: addressType,
    };
  }, [formValues, editingAddress, addressType]);

  const isDisabled = disabled || isRefreshing;

  return (
    <div className="space-y-6">
      {/* Shipping Address */}
      <Card className={errors.shippingAddressId ? 'border-red-300' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Home className="w-4 h-4 min-w-4 min-h-4 sm:w-5 sm:h-5" />
                Shipping Address
              </CardTitle>
              {isRefreshing && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddAddress('shipping')}
              disabled={isDisabled}
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span className='hidden sm:flex ml-2'>Add New</span>
            </Button>
          </div>
          {errors.shippingAddressId && (
            <p className="text-sm text-red-600 mt-2">{errors.shippingAddressId}</p>
          )}
        </CardHeader>
        <CardContent>
          {shippingAddresses.length === 0 ? (
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base mb-4">No shipping addresses found</p>
              <Button 
                onClick={() => handleAddAddress('shipping')} 
                disabled={isDisabled}
                type="button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Shipping Address
              </Button>
            </div>
          ) : (
            <RadioGroup
              value={selectedShippingAddressId || ''}
              onValueChange={onShippingAddressChange}
              disabled={isDisabled}
              className="space-y-3"
            >
              {shippingAddresses.map((address) => (
                <Label
                  key={address.id}
                  htmlFor={`shipping-${address.id}`}
                  className={`flex items-start space-x-1 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedShippingAddressId === address.id
                      ? 'ring-1 ring-primary bg-primary/5 border-primary'
                      : 'hover:border-gray-300'
                  } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RadioGroupItem
                    value={address.id}
                    id={`shipping-${address.id}`}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">
                            {address.fullName}
                          </span>
                          {address.isDefault && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2">
                          {formatAddress(address)}
                        </p>
                        {address.phone && (
                          <p className="text-sm text-muted-foreground">
                            Phone: {address.phone}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditAddress(address);
                        }}
                        disabled={isDisabled}
                        className="text-gray-500 hover ml-2"
                        type="button"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Use Same Address Checkbox */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useSameAddress"
              checked={useSameAddress}
              onCheckedChange={onUseSameAddressChange}
              disabled={isDisabled}
            />
            <Label 
              htmlFor="useSameAddress" 
              className="text-sm font-medium cursor-pointer"
            >
              Use the same address for billing
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-6">
            Your shipping address will be used as the billing address
          </p>
        </CardContent>
      </Card>

      {/* Billing Address */}
      {!useSameAddress && (
        <Card className={errors.billingAddressId ? 'border-red-300' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-4 h-4 min-w-4 min-h-4 sm:w-5 sm:h-5" />
                  Billing Address
                </CardTitle>
                {isRefreshing && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddAddress('billing')}
                disabled={isDisabled}
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span className='hidden sm:flex ml-2'>Add New</span>
              </Button>
            </div>
            {errors.billingAddressId && (
              <p className="text-sm text-red-600 mt-2">{errors.billingAddressId}</p>
            )}
          </CardHeader>
          <CardContent>
            {billingAddresses.length === 0 ? (
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-4">No billing addresses found</p>
                <Button 
                  onClick={() => handleAddAddress('billing')} 
                  disabled={isDisabled}
                  type="button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Billing Address
                </Button>
              </div>
            ) : (
              <RadioGroup
                value={selectedBillingAddressId || ''}
                onValueChange={onBillingAddressChange}
                disabled={isDisabled}
                className="space-y-3"
              >
                {billingAddresses.map((address) => (
                  <Label
                    key={address.id}
                    htmlFor={`billing-${address.id}`}
                    className={`flex items-start space-x-1 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedBillingAddressId === address.id
                        ? 'ring-2 ring-primary bg-primary/5 border-primary'
                        : 'hover:border-gray-300'
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <RadioGroupItem
                      value={address.id}
                      id={`billing-${address.id}`}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              {address.fullName}
                            </span>
                            {address.isDefault && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">
                            {formatAddress(address)}
                          </p>
                          {address.phone && (
                            <p className="text-sm text-muted-foreground">
                              Phone: {address.phone}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          disabled={isDisabled}
                          className="text-gray-500 hover ml-2"
                          type="button"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {/* Address Form Dialog */}
      <AddressForm
        open={showDialog}
        onOpenChange={setShowDialog}
        defaultValues={getFormDefaultValues()}
        onSubmit={handleAddressFormSubmit}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}