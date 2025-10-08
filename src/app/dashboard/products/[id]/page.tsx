// src/app/dashboard/products/[id]/page.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Edit, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/dashboard/page-header";
import { renderPrice, renderDate } from "@/components/dashboard/data-table";
import { getDashboardProduct } from "@/lib/actions/dashboard-products";

interface ProductViewPageProps {
  params: { id: string };
}

const ProductViewPage: React.FC<ProductViewPageProps> = async ({ params }) => {
  const productId = params.id;

  if (!productId) {
    notFound();
  }

  try {
    const productData = await getDashboardProduct(productId);

    if (!productData) {
      notFound();
    }

    const { product, variants, images } = productData;

    // Calculate total stock
    let totalStock = 0;
    if (product.productType === 'simple' && product.inStock !== null && product.inStock !== undefined) {
      totalStock = product.inStock;
    } else {
      totalStock = variants.reduce((sum, variant) => sum + (variant.inStock || 0), 0);
    }

    // Find primary image
    const primaryImage = images.find((img) => img.isPrimary) || images[0];

    // Sort images by sort order
    const sortedImages = [...images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return (
      <div className="space-y-6">
        <PageHeader
          title={product.name}
          action={{
            label: "Edit Product",
            href: `/dashboard/products/${productId}/edit`,
            icon: <Edit className="h-4 w-4" />,
          }}
        >
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Link>
            </Button>
            <Badge variant={product.isPublished ? "default" : "secondary"}>
              {product.isPublished ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Published
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>
            <Badge variant="outline">
              {product.productType === 'simple' ? 'Simple Product' : 'Configurable Product'}
            </Badge>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-lg font-semibold">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <div
                    className="prose prose-sm max-w-none mt-2"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Brand</label>
                    <p>{product.brand?.name || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p>{product.category?.name || "—"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Target Gender</label>
                  <p>{product.gender?.label || "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Simple Product Details */}
            {product.productType === 'simple' && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        SKU
                      </label>
                      <p className="font-mono text-sm">{product.sku || "—"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Price
                      </label>
                      <div className="flex items-center gap-2">
                        {product.salePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {renderPrice(product.price || "0")}
                          </span>
                        )}
                        <span className="font-semibold">
                          {renderPrice(product.salePrice || product.price || "0")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Stock
                      </label>
                      <Badge variant={totalStock > 0 ? "default" : "destructive"}>
                        {totalStock}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Weight
                      </label>
                      <p className="text-sm">{product.weight ? `${product.weight}kg` : "—"}</p>
                    </div>
                  </div>
                  {product.dimensions && (
                    <div className="mt-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Dimensions (L×W×H)
                      </label>
                      <p className="text-sm">
                        {`${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height}cm`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Variants for Configurable Products */}
            {product.productType === 'configurable' && variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants ({variants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={variant.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              SKU
                            </label>
                            <p className="font-mono text-sm">{variant.sku}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Color
                            </label>
                            <div className="flex items-center gap-2">
                              {variant.color && (
                                <>
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: variant.color.hexCode }}
                                  />
                                  <span className="text-sm">{variant.color.name}</span>
                                </>
                              )}
                              {!variant.color && <span className="text-sm text-gray-400">—</span>}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Size
                            </label>
                            <p className="text-sm">{variant.size?.name || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Stock
                            </label>
                            <Badge variant={(variant.inStock || 0) > 0 ? "default" : "destructive"}>
                              {variant.inStock || 0}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Price
                            </label>
                            <div className="flex items-center gap-2">
                              {variant.salePrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  {renderPrice(variant.price)}
                                </span>
                              )}
                              <span className="font-semibold">
                                {renderPrice(variant.salePrice || variant.price)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Weight
                            </label>
                            <p className="text-sm">{variant.weight ? `${variant.weight}kg` : "—"}</p>
                          </div>
                          <div className="lg:col-span-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Dimensions (L×W×H)
                            </label>
                            <p className="text-sm">
                              {variant.dimensions
                                ? `${variant.dimensions.length}×${variant.dimensions.width}×${variant.dimensions.height}cm`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Primary Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                    {primaryImage?.url ? (
                      <Image
                        src={primaryImage.url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Images */}
                  {sortedImages.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {sortedImages.slice(0, 6).map((image) => (
                        <div
                          key={image.id}
                          className="aspect-square bg-gray-100 rounded overflow-hidden relative"
                        >
                          <Image
                            src={image.url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 text-center">
                    Total images: {images.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Stock</span>
                  <Badge variant={totalStock > 0 ? "default" : "destructive"}>
                    {totalStock}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Variants</span>
                  <span className="font-medium">{variants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Images</span>
                  <span className="font-medium">{images.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">{renderDate(product.createdAt || new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm">{renderDate(product.updatedAt || new Date())}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading product:", error);
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Failed to load product</h2>
          <p className="text-gray-600 mt-2">There was an error loading the product. Please try again.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    );
  }
};

export default ProductViewPage;