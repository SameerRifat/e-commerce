// @/components/profile/addresses/addresses-page-client.tsx

'use client';

import { useState } from 'react';
import { Address } from './types';
import { AddressFormValues } from '@/lib/validations/address-validation';
import { useAddressDialog } from './hooks';
import { PageHeader } from './page-header';
import { AddressForm } from './address-form';
import { AddressList } from './address-list';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '@/lib/actions/address-management';
import { toast } from 'sonner';

interface AddressesPageClientProps {
  initialAddresses: Address[];
}

export const AddressesPageClient = ({ initialAddresses }: AddressesPageClientProps) => {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

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

  const handleSubmit = async (data: AddressFormValues) => {
    setIsSubmitting(true);

    try {
      if (isEditing && editingAddress) {
        // Update existing address
        const result = await updateAddress(editingAddress.id, data);
        
        if (result.success) {
          // Update local state with the new data
          setAddresses(prevAddresses => 
            prevAddresses.map(addr => 
              addr.id === editingAddress.id 
                ? { ...data, id: editingAddress.id } 
                : addr
            )
          );
          toast.success('Address updated successfully');
          closeDialog();
        } else {
          // Show validation errors if present
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, errors]) => {
              toast.error(`${field}: ${errors.join(', ')}`);
            });
          } else {
            toast.error(result.error || 'Failed to update address');
          }
        }
      } else {
        // Create new address
        const result = await createAddress(data);
        
        if (result.success && result.data) {
          const newAddress: Address = {
            ...data,
            id: result.data.addressId,
          };
          setAddresses(prevAddresses => [...prevAddresses, newAddress]);
          toast.success('Address added successfully');
          closeDialog();
        } else {
          // Show validation errors if present
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
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Address submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (addressId: string) => {
    setAddressToDelete(addressId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;

    const addressToDeleteId = addressToDelete;
    setDeletingId(addressToDeleteId);
    setShowDeleteDialog(false);

    try {
      const result = await deleteAddress(addressToDeleteId);
      
      if (result.success) {
        setAddresses(prevAddresses => 
          prevAddresses.filter(addr => addr.id !== addressToDeleteId)
        );
        toast.success('Address deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete address');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Address deletion error:', error);
    } finally {
      setDeletingId(null);
      setAddressToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setAddressToDelete(null);
  };

  const handleSetDefault = async (addressId: string) => {
    const address = addresses.find(addr => addr.id === addressId);
    if (!address) return;

    // Prevent race conditions
    if (settingDefaultId) {
      toast.error('Please wait for the current operation to complete.');
      return;
    }

    setSettingDefaultId(addressId);

    // Store previous state for rollback
    const previousAddresses = [...addresses];

    // Optimistically update UI
    setAddresses(prevAddresses => 
      prevAddresses.map(addr => ({
        ...addr,
        isDefault: addr.type === address.type ? addr.id === addressId : addr.isDefault
      }))
    );

    try {
      const result = await setDefaultAddress(addressId, address.type);
      
      if (result.success) {
        toast.success('Default address updated');
      } else {
        // Rollback optimistic update
        setAddresses(previousAddresses);
        toast.error(result.error || 'Failed to set default address');
      }
    } catch (error) {
      // Rollback optimistic update
      setAddresses(previousAddresses);
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Set default address error:', error);
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <>
      <PageHeader onAddAddress={openAddDialog} />

      <AddressList
        addresses={addresses}
        onEdit={openEditDialog}
        onDelete={handleDeleteClick}
        onSetDefault={handleSetDefault}
        onAddAddress={openAddDialog}
        deletingId={deletingId}
        settingDefaultId={settingDefaultId}
      />

      <AddressForm
        open={showDialog}
        onOpenChange={setShowDialog}
        defaultValues={formValues}
        onSubmit={handleSubmit}
        isEditing={isEditing}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={!!deletingId}
      />
    </>
  );
};