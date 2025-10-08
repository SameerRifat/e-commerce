// @/components/profile/addresses/address-form.tsx

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addressFormSchema, type AddressFormValues } from '@/lib/validations/address-validation';
import { StateSelect, CitySelect } from './location-selectors';
import { DEFAULT_FORM_VALUES } from './types';

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  isEditing: boolean;
  isSubmitting?: boolean;
}

export const AddressForm = ({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isEditing,
  isSubmitting = false
}: AddressFormProps) => {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: defaultValues || DEFAULT_FORM_VALUES,
    mode: 'onBlur',
  });

  // Reset form when dialog opens/closes or default values change
  useEffect(() => {
    if (open && defaultValues) {
      form.reset(defaultValues);
    } else if (!open) {
      form.reset(DEFAULT_FORM_VALUES);
    }
  }, [open, defaultValues, form]);

  // Watch stateId to reset city when state changes
  const stateId = form.watch('stateId');
  useEffect(() => {
    if (stateId !== defaultValues?.stateId && form.formState.isDirty) {
      form.setValue('cityId', null as any);
      form.setValue('city', '');
    }
  }, [stateId, form, defaultValues?.stateId]);

  // CRITICAL: Prevent form submission from bubbling up to parent forms
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from bubbling to parent forms
    
    const isValid = await form.trigger();
    if (!isValid) return;
    
    const data = form.getValues();
    await onSubmit(data);
  };

  const handleCancel = () => {
    form.reset(DEFAULT_FORM_VALUES);
    onOpenChange(false);
  };

  const dialogTitle = isEditing ? "Edit Address" : "Add New Address";
  const dialogDescription = isEditing
    ? "Update your address details below."
    : "Add a new address to your address book.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="flex flex-col p-0 sm:max-w-[600px] h-[90vh] max-h-[800px] overflow-hidden gap-0"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if form is submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape if form is submitting
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base 2xl:text-lg font-semibold">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-xs 2xl:text-sm text-muted-foreground">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* CRITICAL: Use onSubmit on the form element with proper event handling */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-6">
                  {/* Address Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select address type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="shipping">Shipping Address</SelectItem>
                            <SelectItem value="billing">Billing Address</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address Line 1 */}
                  <FormField
                    control={form.control}
                    name="line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="House #, Street name" 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address Line 2 */}
                  <FormField
                    control={form.control}
                    name="line2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment, suite, etc. (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apartment, suite, unit, building, floor, etc."
                            {...field}
                            value={field.value || ''}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* State Selection */}
                  <FormField
                    control={form.control}
                    name="stateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province *</FormLabel>
                        <FormControl>
                          <StateSelect
                            value={field.value?.toString() || ''}
                            onChange={(stateId, stateName) => {
                              field.onChange(stateId);
                              form.setValue('state', stateName);
                            }}
                            onBlur={field.onBlur}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City and Postal Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <CitySelect
                              stateId={form.watch('stateId')}
                              value={field.value?.toString() || ''}
                              onChange={(cityId, cityName) => {
                                field.onChange(cityId);
                                form.setValue('city', cityName);
                              }}
                              onBlur={field.onBlur}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 44000"
                              maxLength={5}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Currently serving Pakistan only
                  </div>

                  {/* Phone Number */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+92 300 1234567"
                            {...field}
                            value={field.value || ''}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Format: +92 3XX XXXXXXX or 03XX XXXXXXX
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Set as Default Checkbox */}
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Set as default {form.watch('type')} address
                          </FormLabel>
                        </div>
                        <FormDescription>
                          Your default address will be automatically selected during checkout.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
            </div>

            {/* Fixed Footer */}
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  "Saving..."
                ) : isEditing ? (
                  'Update Address'
                ) : (
                  'Save Address'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// // @/components/profile/addresses/address-form.tsx

// 'use client';

// import { useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Checkbox } from '@/components/ui/checkbox';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogClose,
// } from '@/components/ui/dialog';
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { addressFormSchema, type AddressFormValues } from '@/lib/validations/address-validation';
// import { StateSelect, CitySelect } from './location-selectors';
// import { DEFAULT_FORM_VALUES } from './types';

// interface AddressFormProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   defaultValues?: Partial<AddressFormValues>;
//   onSubmit: (data: AddressFormValues) => Promise<void>;
//   isEditing: boolean;
//   isSubmitting?: boolean;
// }

// export const AddressForm = ({
//   open,
//   onOpenChange,
//   defaultValues,
//   onSubmit,
//   isEditing,
//   isSubmitting = false
// }: AddressFormProps) => {
//   const form = useForm<AddressFormValues>({
//     resolver: zodResolver(addressFormSchema),
//     defaultValues: defaultValues || DEFAULT_FORM_VALUES,
//     mode: 'onBlur', // Validate on blur for better UX
//   });

//   // Reset form when dialog opens/closes or default values change
//   useEffect(() => {
//     if (open && defaultValues) {
//       form.reset(defaultValues);
//     } else if (!open) {
//       form.reset(DEFAULT_FORM_VALUES);
//     }
//   }, [open, defaultValues, form]);

//   // Watch stateId to reset city when state changes
//   const stateId = form.watch('stateId');
//   useEffect(() => {
//     // Reset city fields when state changes (except on initial load)
//     if (stateId !== defaultValues?.stateId && form.formState.isDirty) {
//       form.setValue('cityId', null as any);
//       form.setValue('city', '');
//     }
//   }, [stateId, form, defaultValues?.stateId]);

//   const handleFormSubmit = async (data: AddressFormValues) => {
//     await onSubmit(data);
//   };

//   const handleCancel = () => {
//     form.reset(DEFAULT_FORM_VALUES);
//     onOpenChange(false);
//   };

//   const dialogTitle = isEditing ? "Edit Address" : "Add New Address";
//   const dialogDescription = isEditing
//     ? "Update your address details below."
//     : "Add a new address to your address book.";

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="flex flex-col p-0 sm:max-w-[600px] h-[90vh] max-h-[800px] overflow-hidden gap-0">
//         {/* Fixed Header */}
//         <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
//           <DialogTitle className="text-base 2xl:text-lg font-semibold">
//             {dialogTitle}
//           </DialogTitle>
//           <DialogDescription className="text-xs 2xl:text-sm text-muted-foreground">
//             {dialogDescription}
//           </DialogDescription>
//         </DialogHeader>

//         {/* Scrollable Content */}
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col overflow-hidden">
//             <div className="flex-1 overflow-hidden">
//               <ScrollArea className="h-full px-6 py-4">
//                 <div className="space-y-6">
//                   {/* Address Type */}
//                   <FormField
//                     control={form.control}
//                     name="type"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Address Type *</FormLabel>
//                         <Select
//                           onValueChange={field.onChange}
//                           defaultValue={field.value}
//                           value={field.value}
//                         >
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select address type" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="shipping">Shipping Address</SelectItem>
//                             <SelectItem value="billing">Billing Address</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* Full Name */}
//                   <FormField
//                     control={form.control}
//                     name="fullName"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Full Name *</FormLabel>
//                         <FormControl>
//                           <Input placeholder="Enter your full name" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* Address Line 1 */}
//                   <FormField
//                     control={form.control}
//                     name="line1"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Street Address *</FormLabel>
//                         <FormControl>
//                           <Input placeholder="House #, Street name" {...field} />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* Address Line 2 */}
//                   <FormField
//                     control={form.control}
//                     name="line2"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Apartment, suite, etc. (Optional)</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="Apartment, suite, unit, building, floor, etc."
//                             {...field}
//                             value={field.value || ''}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* State Selection */}
//                   <FormField
//                     control={form.control}
//                     name="stateId"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>State/Province *</FormLabel>
//                         <FormControl>
//                           <StateSelect
//                             value={field.value?.toString() || ''}
//                             onChange={(stateId, stateName) => {
//                               field.onChange(stateId);
//                               form.setValue('state', stateName);
//                             }}
//                             onBlur={field.onBlur}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* City and Postal Code */}
//                   <div className="grid grid-cols-2 gap-4">
//                     <FormField
//                       control={form.control}
//                       name="cityId"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>City *</FormLabel>
//                           <FormControl>
//                             <CitySelect
//                               stateId={form.watch('stateId')}
//                               value={field.value?.toString() || ''}
//                               onChange={(cityId, cityName) => {
//                                 field.onChange(cityId);
//                                 form.setValue('city', cityName);
//                               }}
//                               onBlur={field.onBlur}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />

//                     <FormField
//                       control={form.control}
//                       name="postalCode"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormLabel>Postal Code *</FormLabel>
//                           <FormControl>
//                             <Input
//                               placeholder="e.g. 44000"
//                               maxLength={5}
//                               {...field}
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </div>

//                   <div className="text-xs text-muted-foreground">
//                     Currently serving Pakistan only
//                   </div>

//                   {/* Phone Number */}
//                   <FormField
//                     control={form.control}
//                     name="phone"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Phone Number (Optional)</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="+92 300 1234567"
//                             {...field}
//                             value={field.value || ''}
//                           />
//                         </FormControl>
//                         <FormDescription>
//                           Format: +92 3XX XXXXXXX or 03XX XXXXXXX
//                         </FormDescription>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* Set as Default Checkbox */}
//                   <FormField
//                     control={form.control}
//                     name="isDefault"
//                     render={({ field }) => (
//                       <FormItem className="space-y-3">
//                         <div className="flex items-center space-x-2">
//                           <FormControl>
//                             <Checkbox
//                               checked={field.value}
//                               onCheckedChange={field.onChange}
//                             />
//                           </FormControl>
//                           <FormLabel className="text-sm font-normal">
//                             Set as default {form.watch('type')} address
//                           </FormLabel>
//                         </div>
//                         <FormDescription>
//                           Your default address will be automatically selected during checkout.
//                         </FormDescription>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>
//               </ScrollArea>
//             </div>

//             {/* Fixed Footer */}
//             <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border">
//               <DialogClose asChild>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handleCancel}
//                   disabled={isSubmitting}
//                 >
//                   Cancel
//                 </Button>
//               </DialogClose>
//               <Button
//                 type="submit"
//                 disabled={isSubmitting || !form.formState.isValid}
//               >
//                 {isSubmitting ? (
//                   "Saving..."
//                 ) : isEditing ? (
//                   'Update Address'
//                 ) : (
//                   'Save Address'
//                 )}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// };