// src/app/(root)/collections/page.tsx
import Link from "next/link";
import Image from "next/image";
import { getActiveCollections } from "@/lib/actions/collections";

export default async function CollectionsPage() {
    const collections = await getActiveCollections();

    return (
        <main className="custom_container py-10">
            <header className="mb-8">
                <h1 className="text-heading-2 mb-2">Shop Collections</h1>
                <p className="text-body text-muted-foreground">
                    Discover our curated selections for every occasion
                </p>
            </header>

            {collections.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No collections available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                        <Link
                            key={collection.id}
                            href={`/collections/${collection.slug}`}
                            className="group relative overflow-hidden rounded-lg border hover:shadow-lg transition-all"
                        >
                            <div className="aspect-square relative bg-gray-100">
                                {collection.thumbnailUrl ? (
                                    <Image
                                        src={collection.thumbnailUrl}
                                        alt={collection.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                {/* Collection Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h2 className="text-xl font-bold mb-1">{collection.name}</h2>
                                    {collection.productCount > 0 && (
                                        <p className="text-sm opacity-90">
                                            {collection.productCount} Product{collection.productCount !== 1 ? "s" : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}