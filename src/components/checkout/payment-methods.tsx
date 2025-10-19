// src/components/checkout/payment-methods.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Wallet, Shield } from 'lucide-react';

// Export the payment method type so it can be reused
export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa';

const PAYMENT_OPTIONS = {
  cod: {
    name: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    icon: CreditCard,
    available: true,
    info: [
      'Pay with cash when your order is delivered',
      'No additional fees',
      'Standard delivery: 3-5 business days',
    ],
  },
  jazzcash: {
    name: 'JazzCash',
    description: 'Mobile wallet payment',
    icon: Smartphone,
    available: false,
    info: [
      'Secure mobile wallet payment',
      'Instant payment confirmation',
      'Express delivery: 2-3 business days',
    ],
  },
  easypaisa: {
    name: 'EasyPaisa',
    description: 'Mobile wallet payment',
    icon: Wallet,
    available: false,
    info: [
      'Secure mobile wallet payment',
      'Instant payment confirmation',
      'Express delivery: 2-3 business days',
    ],
  },
} as const;

interface PaymentMethodsProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  error?: string;
}

export function PaymentMethods({ 
  selectedMethod, 
  onMethodChange, 
  disabled = false,
  error,
}: PaymentMethodsProps) {
  const selectedInfo = PAYMENT_OPTIONS[selectedMethod];

  return (
    <Card className={error ? 'border-red-300' : ''}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={(value) => onMethodChange(value as PaymentMethod)}
          disabled={disabled}
          className="space-y-3"
        >
          {Object.entries(PAYMENT_OPTIONS).map(([method, details]) => {
            const Icon = details.icon;
            const isSelected = selectedMethod === method;
            const isAvailable = details.available;

            return (
              <Label
                key={method}
                htmlFor={method}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'ring-1 ring-primary bg-primary/5 border-primary'
                    : 'hover:border-gray-300'
                } ${!isAvailable || disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <RadioGroupItem 
                  value={method} 
                  id={method}
                  disabled={!isAvailable || disabled}
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {details.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {details.description}
                        </div>
                      </div>
                    </div>
                    
                    {!isAvailable && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </Label>
            );
          })}
        </RadioGroup>

        {/* Selected Payment Info */}
        {selectedInfo && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {selectedInfo.info.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
              {!selectedInfo.available && (
                <li className="font-medium text-orange-600 mt-2">
                  🚧 This payment method will be available soon
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Secure Checkout Guaranteed
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Your information is encrypted and secure. We never store sensitive payment details.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}