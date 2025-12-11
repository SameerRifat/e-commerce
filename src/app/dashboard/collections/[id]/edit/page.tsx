// src/app/dashboard/collections/[id]/edit/page.tsx
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import CollectionForm from "@/components/dashboard/collections/collection-form";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LoadingState from "@/components/ui/loading-state";

interface EditCollectionPageProps {
    params: Promise<{
        id: string;
    }>;
}

const EditCollectionPage = async ({ params }: EditCollectionPageProps) => {
    const { id } = await params;

    const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, id))
        .limit(1);

    if (!collection) {
        notFound();
    }

    return (
        <CollectionForm
            mode="edit"
            collectionId={id}
            initialData={collection}
        />
    );
};

export default function EditCollectionPageWithSuspense({
    params,
}: EditCollectionPageProps) {
    return (
        <Suspense
            fallback={<LoadingState size="lg" message="Loading collection..." />}
        >
            <EditCollectionPage params={params} />
        </Suspense>
    );
}