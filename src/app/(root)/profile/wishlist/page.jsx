'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
// import ProductCard from '@/components/shared/ProductCard';

const ProfileWishlistPage = () => {
  // Simplified static data
  const wishlistItems = [
    {
      id: 1,
      name: "Sultan E Ameer | Concentrated Perfume | Attar Oil | 16ml",
      images: ["/new-arrival/1.webp", "/new-arrival/1-1.webp"],
      price: 2500,
      originalPrice: 3200,
      category: "best-sellers",
      brand: "PerfumeHub Premium",
      rating: 4.8,
      reviews: 64,
      inStock: true,
      description: "Addition To Arabia 🔥",
      addedDate: "2024-08-15"
    },
    {
      id: 2,
      name: "Black & Silver Oud | Concentrated Perfume | Attar Oil",
      images: ["/new-arrival/6.webp", "/new-arrival/6-1.webp"],
      price: 2000,
      originalPrice: null,
      category: "best-sellers",
      brand: "Signature Collection",
      rating: 4.6,
      reviews: 78,
      inStock: true,
      description: "King Of The Series 👑",
      addedDate: "2024-08-10"
    },
    {
      id: 3,
      name: "Engraved | Concentrated Perfume | Attar Oil | 16ml",
      images: ["/new-arrival/2.webp", "/new-arrival/2-1.webp"],
      price: 2500,
      originalPrice: null,
      category: "mens-attars",
      brand: "Artisan Series",
      rating: 4.9,
      reviews: 45,
      inStock: false,
      description: "Rich Masculine Scent ✨",
      addedDate: "2024-08-05"
    },
    {
      id: 4,
      name: "White Oudh | Arabic Premium Attars | Concentrated Oils",
      images: ["/new-arrival/8.gif", "/new-arrival/8-1.webp"],
      price: 850,
      originalPrice: 1200,
      category: "eastern",
      brand: "Heritage Collection",
      rating: 4.7,
      reviews: 92,
      inStock: true,
      description: "Classy Men's Fragrance 🔥",
      addedDate: "2024-07-28"
    }
  ];

  const totalValue = wishlistItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">My Wishlist</h2>
          <p className="text-muted-foreground">
            {wishlistItems.length} saved {wishlistItems.length === 1 ? 'item' : 'items'} • 
            Total value: Rs.{totalValue.toLocaleString()}
          </p>
        </div>
        
        {/* Optional: Add all to cart button */}
        {wishlistItems.length > 0 && (
          <Button variant="outline" className="w-fit">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add All to Cart
          </Button>
        )}
      </div>

      {/* Products Grid */}
      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground text-center mb-6">
              Save your favorite fragrances to see them here
            </p>
            <Button>
              Explore Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* {wishlistItems.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))} */}
        </div>
      )}
    </div>
  );
};

export default ProfileWishlistPage;