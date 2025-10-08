// src/components/checkout/payment-methods.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/utils/order-helpers';

interface PaymentMethodsProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  disabled?: boolean;
}

export function PaymentMethods({ 
  selectedMethod, 
  onMethodChange, 
  disabled = false 
}: PaymentMethodsProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cod':
        return <CreditCard className="w-5 h-5" />;
      case 'jazzcash':
        return <Smartphone className="w-5 h-5" />;
      case 'easypaisa':
        return <Wallet className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'cod':
        return 'text-green-600';
      case 'jazzcash':
        return 'text-blue-600';
      case 'easypaisa':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={onMethodChange}
          disabled={disabled}
          className="space-y-4"
        >
          {Object.entries(PAYMENT_METHODS).map(([method, details]) => {
            const isSelected = selectedMethod === method;
            const isAvailable = details.available;
            const isHovered = hoveredMethod === method;

            return (
              <div key={method}>
                <Label
                  htmlFor={method}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : isHovered 
                        ? 'border-gray-300 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                  } ${!isAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onMouseEnter={() => setHoveredMethod(method)}
                  onMouseLeave={() => setHoveredMethod(null)}
                >
                  <RadioGroupItem 
                    value={method} 
                    id={method}
                    disabled={!isAvailable || disabled}
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${getPaymentColor(method)} ${!isAvailable ? 'opacity-50' : ''}`}>
                          {getPaymentIcon(method)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {details.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {details.description}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!isAvailable && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Coming Soon
                          </Badge>
                        )}
                        {isSelected && isAvailable && (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {/* Payment Method Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
          <div className="text-sm text-blue-800 space-y-1">
            {selectedMethod === 'cod' && (
              <div>
                <p>• Pay with cash when your order arrives</p>
                <p>• No additional fees for Cash on Delivery</p>
                <p>• Delivery time: 3-5 business days</p>
              </div>
            )}
            {selectedMethod === 'jazzcash' && (
              <div>
                <p>• Secure mobile wallet payment</p>
                <p>• Instant payment confirmation</p>
                <p>• Delivery time: 2-3 business days</p>
                <p className="font-medium text-orange-600 mt-2">
                  🚧 This payment method is coming soon!
                </p>
              </div>
            )}
            {selectedMethod === 'easypaisa' && (
              <div>
                <p>• Secure mobile wallet payment</p>
                <p>• Instant payment confirmation</p>
                <p>• Delivery time: 2-3 business days</p>
                <p className="font-medium text-orange-600 mt-2">
                  🚧 This payment method is coming soon!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800 font-medium">
              Secure Checkout Guaranteed
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Your payment information is encrypted and secure. We never store your payment details.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
