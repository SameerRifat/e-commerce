// src/components/shared/products-grid-wrapper.tsx
import React from 'react';

interface ProductGridProps {
    children: React.ReactNode;
}

const ProductGrid: React.FC<ProductGridProps> = ({ children }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
            {children}
        </div>
    );
};

export default ProductGrid;