// src/app/(root)/profile/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/actions';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ProfileHeader from '@/components/profile/profile-header';
import AccountInformationSection from '@/components/profile/account-information-section';
import SecuritySettingsSection from '@/components/profile/security-settings-section';

export const metadata = {
  title: 'My Profile',
  description: 'Manage your account information and settings',
};

interface ProfilePageProps {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const userData = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!userData) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const successMessage = params.success;
  const errorMessage = params.error;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Messages */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          {decodeURIComponent(successMessage)}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {decodeURIComponent(errorMessage)}
        </div>
      )}

      {/* Modern Single Column Layout - Industry Standard */}
      <ProfileHeader user={userData} />
      
      <div className="space-y-6">
        <AccountInformationSection user={userData} />
        <SecuritySettingsSection user={userData} />
      </div>
    </div>
  );
}