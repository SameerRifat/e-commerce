// @/components/profile/addresses/hooks.ts

'use client';

import { useState } from 'react';
import { Address, DEFAULT_FORM_VALUES } from './types';
import { AddressFormValues } from '@/lib/validations/address-validation';

export const useAddressDialog = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formValues, setFormValues] = useState<Partial<AddressFormValues>>(DEFAULT_FORM_VALUES);

  const openAddDialog = () => {
    setEditingAddress(null);
    setFormValues(DEFAULT_FORM_VALUES);
    setShowDialog(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormValues({
      type: address.type,
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      cityId: address.cityId || null,
      state: address.state,
      stateId: address.stateId || null,
      postalCode: address.postalCode,
      country: address.country,
      countryCode: address.countryCode,
      countryId: address.countryId,
      phone: address.phone || '',
      isDefault: address.isDefault,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingAddress(null);
    setFormValues(DEFAULT_FORM_VALUES);
  };

  return {
    showDialog,
    setShowDialog,
    editingAddress,
    formValues,
    openAddDialog,
    openEditDialog,
    closeDialog,
    isEditing: editingAddress !== null
  };
};