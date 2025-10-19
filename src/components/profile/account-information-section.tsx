// src/components/profile/account-information-section.tsx
'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { type SelectUser } from '@/lib/db/schema';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/actions/profile';

const accountSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountInformationSectionProps {
  user: SelectUser;
}

export default function AccountInformationSection({
  user,
}: AccountInformationSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state for user data - only used in display mode
  const [optimisticUser, setOptimisticUser] = useOptimistic(
    { name: user.name, email: user.email },
    (state, newUser: { name: string; email: string }) => newUser
  );

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
    },
  });

  const handleAccountUpdate = async (values: AccountFormValues) => {
    // Check if anything actually changed
    if (values.name === user.name && values.email === user.email) {
      toast.info('No changes to save');
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateUserProfile(user.id, {
        name: values.name,
        email: values.email,
      });

      if (result.success) {
        // Update optimistic state for instant display after closing edit mode
        setOptimisticUser({ name: values.name, email: values.email });
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        
        // Soft refresh in background - only updates server components without full reload
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Account update error:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    form.reset({
      name: user.name || '',
      email: user.email,
    });
    setIsEditing(false);
  };

  const isLoading = isSaving || isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Manage your personal details and contact information
            </CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!isEditing ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="font-medium">{optimisticUser.name || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{optimisticUser.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAccountUpdate)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        autoComplete="name"
                        disabled={isSaving}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        disabled={isSaving}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button type="submit" size="sm" disabled={isSaving}>
                  <Check className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}