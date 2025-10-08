// @/components/profile/addresses/empty-state.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddAddress: () => void;
}

export const EmptyState = ({ onAddAddress }: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
        <p className="text-muted-foreground text-center mb-4">
          Add your first address to make checkout faster and easier.
        </p>
        <Button onClick={onAddAddress}>
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Address
        </Button>
      </CardContent>
    </Card>
  );
};