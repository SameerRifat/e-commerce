// src/app/(root)/profile/orders/page.tsx

import { OrdersPageClient } from '@/components/profile/orders/orders-page-client';
import { getUserOrders } from '@/lib/actions/orders';
import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';

const OrdersPage = async () => {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in?returnUrl=/profile/orders');
  }

  // Fetch user orders
  const ordersResult = await getUserOrders();
  
  if (!ordersResult.success) {
    // Handle error case - you might want to show an error page or redirect
    console.error('Failed to fetch orders:', ordersResult.error);
  }

  const orders = ordersResult.orders || [];

  return (
    <div className="space-y-6">
      <OrdersPageClient initialOrders={orders} />
    </div>
  );
};

export default OrdersPage;

export const metadata = {
  title: "My Orders | Cosmetics Store",
  description: "View and manage your orders",
};
