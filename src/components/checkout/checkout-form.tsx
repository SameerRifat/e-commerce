// src/components/checkout/checkout-form.tsx

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AddressSelector } from './address-selector';
import { PaymentMethods } from './payment-methods';
import { OrderSummary } from './order-summary';
import { CheckoutSession, createCheckoutSession, updateCheckoutSession, processOrder } from '@/lib/actions/checkout';
import { CartItemWithDetails } from '@/lib/actions/cart';
import { OrderCalculation, CheckoutData } from '@/lib/utils/order-helpers';
import { Address } from '@/components/profile/addresses/types';
import { getUserAddresses } from '@/lib/actions/address-management';

interface CheckoutFormProps {
  initialSession?: CheckoutSession;
  cartItems: CartItemWithDetails[];
  calculation: OrderCalculation;
  userAddresses: Address[];
}

export function CheckoutForm({ 
  initialSession, 
  cartItems, 
  calculation, 
  userAddresses: initialAddresses 
}: CheckoutFormProps) {
  const [session, setSession] = useState<CheckoutSession | null>(initialSession || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Address state management
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isRefreshingAddresses, startAddressRefresh] = useTransition();

  // Form state
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>('');
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>('');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash' | 'easypaisa'>('cod');
  const [orderNotes, setOrderNotes] = useState('');

  // Initialize form with default addresses
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultShipping = addresses.find(addr => addr.type === 'shipping' && addr.isDefault);
      const defaultBilling = addresses.find(addr => addr.type === 'billing' && addr.isDefault);
      
      if (defaultShipping && !selectedShippingAddressId) {
        setSelectedShippingAddressId(defaultShipping.id);
      }
      if (defaultBilling && !useSameAddress && !selectedBillingAddressId) {
        setSelectedBillingAddressId(defaultBilling.id);
      }
    }
  }, [addresses, useSameAddress]);

  // Create checkout session if not provided
  useEffect(() => {
    if (!session && cartItems.length > 0) {
      createSession();
    }
  }, [session, cartItems]);

  const createSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createCheckoutSession();
      if (result.success && result.session) {
        setSession(result.session);
      } else {
        setError(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      setError('Failed to create checkout session');
      console.error('Checkout session creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh addresses after CRUD operations
  const handleAddressesChange = async () => {
    startAddressRefresh(async () => {
      try {
        const refreshedAddresses = await getUserAddresses();
        setAddresses(refreshedAddresses);
      } catch (error) {
        console.error('Error refreshing addresses:', error);
        toast.error('Failed to refresh addresses');
      }
    });
  };

  const handleAddressChange = async () => {
    if (!session) return;

    const checkoutData: CheckoutData = {
      shippingAddressId: selectedShippingAddressId,
      billingAddressId: useSameAddress ? undefined : selectedBillingAddressId,
      paymentMethod,
      notes: orderNotes.trim() || undefined,
      useSameAddress,
    };

    try {
      const result = await updateCheckoutSession(session.id, checkoutData);
      if (result.success && result.session) {
        setSession(result.session);
      }
    } catch (error) {
      console.error('Error updating checkout session:', error);
    }
  };

  // Update session when form data changes (debounced)
  useEffect(() => {
    if (session && selectedShippingAddressId) {
      const timeoutId = setTimeout(() => {
        handleAddressChange();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedShippingAddressId, selectedBillingAddressId, useSameAddress, paymentMethod, orderNotes]);

  const validateForm = (): boolean => {
    if (!selectedShippingAddressId) {
      toast.error('Please select a shipping address');
      return false;
    }

    if (!useSameAddress && !selectedBillingAddressId) {
      toast.error('Please select a billing address');
      return false;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !validateForm()) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const checkoutData: CheckoutData = {
        shippingAddressId: selectedShippingAddressId,
        billingAddressId: useSameAddress ? undefined : selectedBillingAddressId,
        paymentMethod,
        notes: orderNotes.trim() || undefined,
        useSameAddress,
      };

      const result = await processOrder(session.id, checkoutData);
      
      if (result.success && result.orderId) {
        // Redirect to success page
        window.location.href = `/checkout/success?orderId=${result.orderId}`;
      } else {
        setError(result.error || 'Failed to process order');
        toast.error(result.error || 'Failed to process order');
      }
    } catch (error) {
      setError('Failed to process order');
      toast.error('Failed to process order');
      console.error('Order processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Setting up your checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Checkout Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={createSession}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <AddressSelector
            addresses={addresses}
            selectedShippingAddressId={selectedShippingAddressId}
            selectedBillingAddressId={selectedBillingAddressId}
            onShippingAddressChange={setSelectedShippingAddressId}
            onBillingAddressChange={setSelectedBillingAddressId}
            onUseSameAddressChange={setUseSameAddress}
            useSameAddress={useSameAddress}
            disabled={isProcessing}
            onAddressesChange={handleAddressesChange}
            isRefreshing={isRefreshingAddresses}
          />

          {/* Payment Method */}
          <PaymentMethods
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            disabled={isProcessing}
          />

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Order Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="orderNotes">
                  Special instructions for your order
                </Label>
                <Textarea
                  id="orderNotes"
                  placeholder="e.g., Leave package at front door, Call before delivery, etc."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  disabled={isProcessing}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">Terms & Conditions</p>
                  <p>
                    By placing this order, you agree to our{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    . Your order will be processed according to our return and refund policy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <OrderSummary
              cartItems={cartItems}
              calculation={calculation}
              paymentMethod={paymentMethod}
              disabled={isProcessing}
            />

            {/* Place Order Button */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isProcessing || !selectedShippingAddressId || (!useSameAddress && !selectedBillingAddressId)}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      Place Order - {calculation.totalAmount.toLocaleString('en-PK', { 
                        style: 'currency', 
                        currency: 'PKR',
                        minimumFractionDigits: 0 
                      })}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  You will be redirected to the order confirmation page after successful placement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}