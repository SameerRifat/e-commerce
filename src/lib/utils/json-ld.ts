// src/lib/utils/json-ld.ts
/**
 * JSON-LD Structured Data Utilities for E-commerce SEO
 *
 * Following Schema.org standards and Google's structured data guidelines
 * Reference: https://schema.org/Product, https://schema.org/Organization
 */

import { FullProduct } from "@/lib/actions/product";

// Base URL for the site - should be set from environment
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cosmeticspk.com';
const SITE_NAME = 'Cosmeticspk';

/**
 * Organization Schema - For homepage and site-wide identity
 * Used by search engines to understand business entity
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Premium cosmetics and beauty products for your natural glow',
    sameAs: [
      // Add social media profiles here when available
      // 'https://www.facebook.com/cosmeticspk',
      // 'https://www.instagram.com/cosmeticspk',
      // 'https://twitter.com/cosmeticspk',
    ],
  };
}

/**
 * Product Schema - For individual product pages
 * Includes price, availability, reviews, and images
 */
export function generateProductSchema(params: {
  product: FullProduct['product'];
  variants: FullProduct['variants'];
  images: FullProduct['images'];
  averageRating?: number;
  reviewCount?: number;
  baseUrl: string;
}) {
  const { product, variants, images, averageRating, reviewCount, baseUrl } = params;

  // Determine pricing and availability
  let price: number;
  let availability: string;

  if (product.productType === 'simple') {
    const salePrice = product.salePrice ? Number(product.salePrice) : undefined;
    const regularPrice = product.price ? Number(product.price) : undefined;
    price = salePrice || regularPrice || 0;
    availability = product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  } else {
    // For configurable products, use the default variant or first available variant
    const defaultVariant = variants.find(v => v.id === product.defaultVariantId);
    const firstVariant = variants[0];
    const variantToUse = defaultVariant || firstVariant;

    if (variantToUse) {
      const salePrice = variantToUse.salePrice ? Number(variantToUse.salePrice) : undefined;
      const regularPrice = variantToUse.price ? Number(variantToUse.price) : undefined;
      price = salePrice || regularPrice || 0;
      availability = variantToUse.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    } else {
      price = 0;
      availability = 'https://schema.org/OutOfStock';
    }
  }

  // Get primary image
  const primaryImage = images.find(img => img.isPrimary)?.url || images[0]?.url;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description
      ? product.description.substring(0, 160)
      : product.name,
    image: primaryImage ? [primaryImage] : undefined,
    url: `${baseUrl}/products/${product.slug}`,
    sku: product.sku || undefined,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand.name,
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: 'PKR',
      price: price,
      availability: availability,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    },
  };

  // Add aggregate rating if available
  if (averageRating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Breadcrumb Schema - For navigation hierarchy
 * Helps search engines understand site structure
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * Collection/ItemList Schema - For collection pages
 * Represents a curated list of products
 */
export function generateCollectionSchema(params: {
  name: string;
  description?: string;
  url: string;
  products: Array<{
    name: string;
    url: string;
    image?: string;
  }>;
}) {
  const { name, description, url, products } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: name,
    description: description || undefined,
    url: `${SITE_URL}${url}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `${SITE_URL}${product.url}`,
          image: product.image || undefined,
        },
      })),
    },
  };
}

/**
 * WebSite Schema - For homepage search action
 * Enables site search in Google results
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
