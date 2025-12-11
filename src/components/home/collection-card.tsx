// src/components/home/collection-card.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import type { SelectCollection } from "@/lib/db/schema";

interface CollectionCardProps {
  collection: SelectCollection;
}

/**
 * Collection card with image overlay and hover effects
 * Industry pattern: Image-first approach with gradient overlay for text readability
 */
export function CollectionCard({ collection }: CollectionCardProps) {
  const imageUrl = collection.thumbnailUrl || collection.imageUrl;
  const hasImage = !!imageUrl;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-300 block"
    >
      {/* Image Container - 4:3 aspect ratio */}
      <div className="relative aspect-[4/3] bg-muted">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={collection.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

        {/* Collection Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h3 className="text-xl font-bold mb-1 transition-transform duration-300 group-hover:translate-y-[-2px]">
            {collection.name}
          </h3>
          {collection.description && (
            <p className="text-sm opacity-90 line-clamp-2">
              {collection.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
