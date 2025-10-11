// src/components/dashboard/products/steps/ProductBasicInfoStep.tsx
"use client";

import React from "react";
import { Control } from "react-hook-form";
import { Package, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/dashboard/rich-text-editor";
import { VALIDATION_RULES } from "@/lib/validations/product-form";

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Gender {
  id: string;
  label: string;
}

interface ProductBasicInfoStepProps {
  control: Control<any>;
  brands: Brand[];
  categories: Category[];
  genders: Gender[];
}

const ProductBasicInfoStep: React.FC<ProductBasicInfoStepProps> = ({
  control,
  brands,
  categories,
  genders,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Basic Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Luxe Matte Lipstick"
                        maxLength={VALIDATION_RULES.product.name.maxLength}
                        className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/{VALIDATION_RULES.product.name.maxLength} characters
                    </FormDescription>
                    {fieldState.error && fieldState.isTouched && (
                      <FormMessage />
                    )}
                  </FormItem>
              )}
            />

            <FormField
              control={control}
              name="brandId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select 
                    key={`brand-${field.value}`}
                    onValueChange={field.onChange} 
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    key={`category-${field.value}`}
                    onValueChange={field.onChange} 
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="genderId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Target Gender</FormLabel>
                  <Select 
                    key={`gender-${field.value}`}
                    onValueChange={field.onChange} 
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select target gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genders.map((gender) => (
                        <SelectItem key={gender.id} value={gender.id}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="productType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <Select 
                    key={`productType-${field.value}`}
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="simple">Simple Product</SelectItem>
                      <SelectItem value="configurable">Configurable Product</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Simple products have fixed pricing and no variants. Configurable products have multiple variants (colors, sizes, etc.)
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Published
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Draft
                        </div>
                      )}
                    </FormLabel>
                    <FormDescription>
                      {field.value
                        ? "Product will be visible to customers"
                        : "Product will be saved as draft"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Product Description *</FormLabel>
              <FormControl>
                <RichTextEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Describe your product's benefits, ingredients, and usage instructions..."
                />
              </FormControl>
              <FormDescription>
                Provide detailed information about the product ({field.value?.length || 0}/{VALIDATION_RULES.product.description.maxLength} characters)
              </FormDescription>
              {fieldState.error && fieldState.isTouched && (
                <FormMessage />
              )}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProductBasicInfoStep;

// // src/components/dashboard/products/steps/ProductBasicInfoStep.tsx
// "use client";

// import React from "react";
// import { Control } from "react-hook-form";
// import { Package, Eye, EyeOff } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import RichTextEditor from "@/components/dashboard/rich-text-editor";
// import { VALIDATION_RULES } from "@/lib/validations/product-form";

// interface Brand {
//   id: string;
//   name: string;
// }

// interface Category {
//   id: string;
//   name: string;
// }

// interface Gender {
//   id: string;
//   label: string;
// }

// interface ProductBasicInfoStepProps {
//   control: Control<any>;
//   brands: Brand[];
//   categories: Category[];
//   genders: Gender[];
// }

// const ProductBasicInfoStep: React.FC<ProductBasicInfoStepProps> = ({
//   control,
//   brands,
//   categories,
//   genders,
// }) => {
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Package className="h-5 w-5" />
//           Basic Product Information
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="space-y-4">
//             <FormField
//               control={control}
//               name="name"
//               render={({ field, fieldState }) => (
//                   <FormItem>
//                     <FormLabel>Product Name *</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="e.g., Luxe Matte Lipstick"
//                         maxLength={VALIDATION_RULES.product.name.maxLength}
//                         className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormDescription>
//                       {field.value?.length || 0}/{VALIDATION_RULES.product.name.maxLength} characters
//                     </FormDescription>
//                     {fieldState.error && fieldState.isTouched && (
//                       <FormMessage />
//                     )}
//                   </FormItem>
//               )}
//             />

//             <FormField
//               control={control}
//               name="brandId"
//               render={({ field, fieldState }) => (
//                 <FormItem>
//                   <FormLabel>Brand</FormLabel>
//                   <Select onValueChange={field.onChange} value={field.value || ""}>
//                     <FormControl>
//                       <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
//                         <SelectValue placeholder="Select brand" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {brands.map((brand) => (
//                         <SelectItem key={brand.id} value={brand.id}>
//                           {brand.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   {fieldState.error && fieldState.isTouched && (
//                     <FormMessage />
//                   )}
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={control}
//               name="categoryId"
//               render={({ field, fieldState }) => (
//                 <FormItem>
//                   <FormLabel>Category</FormLabel>
//                   <Select onValueChange={field.onChange} value={field.value || ""}>
//                     <FormControl>
//                       <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
//                         <SelectValue placeholder="Select category" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {categories.map((category) => (
//                         <SelectItem key={category.id} value={category.id}>
//                           {category.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   {fieldState.error && fieldState.isTouched && (
//                     <FormMessage />
//                   )}
//                 </FormItem>
//               )}
//             />
//           </div>

//           <div className="space-y-4">
//             <FormField
//               control={control}
//               name="genderId"
//               render={({ field, fieldState }) => (
//                 <FormItem>
//                   <FormLabel>Target Gender</FormLabel>
//                   <Select onValueChange={field.onChange} value={field.value || ""}>
//                     <FormControl>
//                       <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
//                         <SelectValue placeholder="Select target gender" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {genders.map((gender) => (
//                         <SelectItem key={gender.id} value={gender.id}>
//                           {gender.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   {fieldState.error && fieldState.isTouched && (
//                     <FormMessage />
//                   )}
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={control}
//               name="productType"
//               render={({ field, fieldState }) => (
//                 <FormItem>
//                   <FormLabel>Product Type</FormLabel>
//                   <Select onValueChange={field.onChange} value={field.value || "simple"}>
//                     <FormControl>
//                       <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
//                         <SelectValue placeholder="Select product type" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem value="simple">Simple Product</SelectItem>
//                       <SelectItem value="configurable">Configurable Product</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <FormDescription>
//                     Simple products have fixed pricing and no variants. Configurable products have multiple variants (colors, sizes, etc.)
//                   </FormDescription>
//                   {fieldState.error && fieldState.isTouched && (
//                     <FormMessage />
//                   )}
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={control}
//               name="isPublished"
//               render={({ field }) => (
//                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                   <div className="space-y-0.5">
//                     <FormLabel className="text-base">
//                       {field.value ? (
//                         <div className="flex items-center gap-2">
//                           <Eye className="h-4 w-4" />
//                           Published
//                         </div>
//                       ) : (
//                         <div className="flex items-center gap-2">
//                           <EyeOff className="h-4 w-4" />
//                           Draft
//                         </div>
//                       )}
//                     </FormLabel>
//                     <FormDescription>
//                       {field.value
//                         ? "Product will be visible to customers"
//                         : "Product will be saved as draft"}
//                     </FormDescription>
//                   </div>
//                   <FormControl>
//                     <Switch
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                 </FormItem>
//               )}
//             />
//           </div>
//         </div>

//         <FormField
//           control={control}
//           name="description"
//           render={({ field, fieldState }) => (
//             <FormItem>
//               <FormLabel>Product Description *</FormLabel>
//               <FormControl>
//                 <RichTextEditor
//                   content={field.value}
//                   onChange={field.onChange}
//                   placeholder="Describe your product's benefits, ingredients, and usage instructions..."
//                 />
//               </FormControl>
//               <FormDescription>
//                 Provide detailed information about the product ({field.value?.length || 0}/{VALIDATION_RULES.product.description.maxLength} characters)
//               </FormDescription>
//               {fieldState.error && fieldState.isTouched && (
//                 <FormMessage />
//               )}
//             </FormItem>
//           )}
//         />
//       </CardContent>
//     </Card>
//   );
// };

// export default ProductBasicInfoStep;
