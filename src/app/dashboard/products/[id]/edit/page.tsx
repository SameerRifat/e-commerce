// src/app/dashboard/products/[id]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/components/dashboard/products/product-form";

const EditProductPage: React.FC = () => {
  const params = useParams();
  const productId = params.id as string;

  return <ProductForm mode="edit" productId={productId} />;
};

export default EditProductPage;
