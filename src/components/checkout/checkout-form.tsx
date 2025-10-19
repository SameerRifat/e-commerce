// src/components/checkout/checkout-form.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AddressSelector } from './address-selector';
import { PaymentMethods } from './payment-methods';
import { OrderSummary } from './order-summary';
import { processOrder, type CheckoutInput } from '@/lib/actions/checkout';
import { getUserAddresses } from '@/lib/actions/address-management';
import type { Address } from '@/components/profile/addresses/types';

interface CartItem {
  id: string;
  productId: string | null;
  productVariantId: string | null;
  isSimpleProduct: boolean;
  quantity: number;
  productName: string;
  productSlug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  inStock: number;
  image: string | null;
  color?: {
    name: string;
    hexCode: string;
  };
  size?: {
    name: string;
  };
}

interface Calculation {
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  totalAmount: string;
}

interface CheckoutFormProps {
  cartItems: CartItem[];
  calculation: Calculation;
  userAddresses: Address[];
}

export function CheckoutForm({ 
  cartItems, 
  calculation, 
  userAddresses: initialAddresses 
}: CheckoutFormProps) {
  const router = useRouter();
  
  // State
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [shippingAddressId, setShippingAddressId] = useState<string>(() => {
    const defaultShipping = initialAddresses.find(
      addr => addr.type === 'shipping' && addr.isDefault
    );
    return defaultShipping?.id || '';
  });
  const [billingAddressId, setBillingAddressId] = useState<string>(() => {
    const defaultBilling = initialAddresses.find(
      addr => addr.type === 'billing' && addr.isDefault
    );
    return defaultBilling?.id || '';
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash' | 'easypaisa'>('cod');
  const [notes, setNotes] = useState('');
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleAddressesChange = async () => {
    startRefresh(async () => {
      try {
        const refreshed = await getUserAddresses();
        setAddresses(refreshed);
        
        // Auto-select new default addresses if current selection is empty
        if (!shippingAddressId) {
          const defaultShipping = refreshed.find(
            addr => addr.type === 'shipping' && addr.isDefault
          );
          if (defaultShipping) setShippingAddressId(defaultShipping.id);
        }
        
        if (!useSameAddress && !billingAddressId) {
          const defaultBilling = refreshed.find(
            addr => addr.type === 'billing' && addr.isDefault
          );
          if (defaultBilling) setBillingAddressId(defaultBilling.id);
        }
      } catch (error) {
        console.error('Error refreshing addresses:', error);
        toast.error('Failed to refresh addresses');
      }
    });
  };

  const validateForm = (): boolean => {
    setFieldErrors({});
    
    const errors: Record<string, string> = {};
    
    if (!shippingAddressId) {
      errors.shippingAddressId = 'Please select a shipping address';
    }
    
    if (!useSameAddress && !billingAddressId) {
      errors.billingAddressId = 'Please select a billing address';
    }
    
    if (!paymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }
    
    if (notes.length > 500) {
      errors.notes = 'Notes must be less than 500 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors above');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setFieldErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const input: CheckoutInput = {
        shippingAddressId,
        billingAddressId: useSameAddress ? undefined : billingAddressId,
        useSameAddress,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const result = await processOrder(input);
      
      if (result.success && result.orderId) {
        toast.success('Order placed successfully!');
        // Redirect to success page
        router.push(`/checkout/success?orderId=${result.orderId}`);
      } else {
        setError(result.error || 'Failed to process order');
        
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        
        toast.error(result.error || 'Failed to process order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to process order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isRefreshing;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Global Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Address Selection */}
          <AddressSelector
            addresses={addresses}
            selectedShippingAddressId={shippingAddressId}
            selectedBillingAddressId={billingAddressId}
            onShippingAddressChange={setShippingAddressId}
            onBillingAddressChange={setBillingAddressId}
            onUseSameAddressChange={setUseSameAddress}
            useSameAddress={useSameAddress}
            disabled={isFormDisabled}
            onAddressesChange={handleAddressesChange}
            isRefreshing={isRefreshing}
            errors={{
              shippingAddressId: fieldErrors.shippingAddressId,
              billingAddressId: fieldErrors.billingAddressId,
            }}
          />

          {/* Payment Method */}
          <PaymentMethods
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            disabled={isFormDisabled}
            error={fieldErrors.paymentMethod}
          />

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Order Notes (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="notes">
                Special instructions for your order
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g., Leave package at front door, Call before delivery, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isFormDisabled}
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              {notes.length > 0 && (
                <p className="text-xs text-gray-500">
                  {notes.length}/500 characters
                </p>
              )}
              {fieldErrors.notes && (
                <p className="text-sm text-red-600">{fieldErrors.notes}</p>
              )}
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">
                    Terms & Conditions
                  </p>
                  <p>
                    By placing this order, you agree to our{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary & Submit */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            
            {/* Order Summary */}
            <OrderSummary
              cartItems={cartItems}
              calculation={calculation}
              paymentMethod={paymentMethod}
            />

            {/* Place Order Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    isFormDisabled || 
                    !shippingAddressId || 
                    (!useSameAddress && !billingAddressId)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      Place Order - Rs.{parseFloat(calculation.totalAmount).toLocaleString('en-PK')}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Secure checkout · Your payment info is encrypted
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}