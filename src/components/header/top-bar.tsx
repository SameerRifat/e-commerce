// components/shared/top-bar.tsx
'use client';

import { Phone, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const TopBar = () => {
  return (
    <motion.div
      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs sm:text-sm overflow-hidden h-8 sm:h-9 flex items-center"
    >
      <div className="custom_container py-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-6 sm:font-medium">
            <div className="flex items-center space-x-2">
              <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Free Delivery on Orders Above Rs. 2000</span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+923001234567">+92 300 1234567</a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar; 