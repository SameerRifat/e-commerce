"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import DataTable, { Column, renderDate } from "@/components/dashboard/data-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Mock data for collections
interface Collection {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  createdAt: Date;
}

const mockCollections: Collection[] = [
  {
    id: "1",
    name: "Summer Glow 2024",
    slug: "summer-glow-2024",
    productCount: 12,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Autumn Elegance",
    slug: "autumn-elegance",
    productCount: 8,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    name: "Holiday Glamour",
    slug: "holiday-glamour",
    productCount: 15,
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "4",
    name: "Natural Beauty Essentials",
    slug: "natural-beauty-essentials",
    productCount: 18,
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "5",
    name: "Bold & Beautiful",
    slug: "bold-beautiful",
    productCount: 10,
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "6",
    name: "Minimalist Collection",
    slug: "minimalist-collection",
    productCount: 6,
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "7",
    name: "Professional Makeup Kit",
    slug: "professional-makeup-kit",
    productCount: 22,
    createdAt: new Date("2024-02-15"),
  },
];

const CollectionsPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    return mockCollections.filter((collection) =>
      searchTerm === "" ||
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleEdit = (collection: Collection) => {
    router.push(`/dashboard/collections/${collection.id}/edit`);
  };

  const handleDelete = (collection: Collection) => {
    // In a real app, this would show a confirmation dialog and call an API
    console.log("Delete collection:", collection.id);
  };

  const handleView = (collection: Collection) => {
    router.push(`/dashboard/collections/${collection.id}`);
  };

  const columns: Column<Collection>[] = [
    {
      key: "name",
      label: "Collection Name",
      render: (name: string, collection: Collection) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">/{collection.slug}</div>
        </div>
      ),
    },
    {
      key: "productCount",
      label: "Products",
      render: (count: number) => (
        <Badge variant={count > 0 ? "default" : "secondary"}>
          {count}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: renderDate,
    },
  ];

  const totalCollections = filteredCollections.length;
  const totalProducts = filteredCollections.reduce((sum, collection) => sum + collection.productCount, 0);
  const activeCollections = filteredCollections.filter((collection) => collection.productCount > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Curate themed product collections for seasonal campaigns and special promotions"
        action={{
          label: "Add Collection",
          onClick: () => router.push("/dashboard/collections/new"),
          icon: <Plus className="h-4 w-4" />,
        }}
      >
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </PageHeader>

      <DataTable
        data={filteredCollections}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        emptyMessage="No collections found. Create your first collection to group related products."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {totalCollections}
          </div>
          <div className="text-sm text-gray-600">Total Collections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {activeCollections}
          </div>
          <div className="text-sm text-gray-600">Active Collections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalProducts}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;
