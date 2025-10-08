// @/components/profile/addresses/types.ts
import { AddressFormValues } from '@/lib/validations/address-validation';

// Re-export the form values type
export type { AddressFormValues };

// Location types from react-country-state-city
export interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
}

export interface State {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  state_code: string;
  type: string | null;
  latitude: string;
  longitude: string;
}

export interface City {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  state_id: number;
  state_code: string;
  state_name: string;
  latitude: string;
  longitude: string;
}

// Address type aligned with database schema
export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  cityId?: number | null;
  state: string;
  stateId?: number | null;
  postalCode: string;
  country: string;
  countryCode: string;
  countryId: number;
  phone?: string | null;
  isDefault: boolean;
}

// Pakistan-specific constants
export const PAKISTAN_COUNTRY = {
  id: 167,
  name: 'Pakistan',
  iso2: 'PK',
  iso3: 'PAK',
  phonecode: '+92'
} as const;

// Default form values
export const DEFAULT_FORM_VALUES: Partial<AddressFormValues> = {
  type: 'shipping',
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  cityId: undefined,
  state: '',
  stateId: undefined,
  postalCode: '',
  country: PAKISTAN_COUNTRY.name,
  countryCode: PAKISTAN_COUNTRY.iso2,
  countryId: PAKISTAN_COUNTRY.id,
  phone: '',
  isDefault: false
};