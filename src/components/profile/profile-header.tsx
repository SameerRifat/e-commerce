// src/components/profile/profile-header.tsx
'use client';

import { Camera, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type SelectUser } from '@/lib/db/schema';
import ProfileImageUploadDialog from './profile-image-upload-dialog';
import { formatDate } from '@/lib/utils';

interface ProfileHeaderProps {
  user: SelectUser;
}

function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
      {/* Avatar Section */}
      <div className="relative group">
        <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
          {user.image && (
            <AvatarImage 
              src={user.image} 
              alt={user.name || ''} 
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground">
            {getUserInitials(user.name || 'U')}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Button Overlay */}
        <div className="absolute -bottom-2 -right-2">
          <ProfileImageUploadDialog userId={user.id} currentImage={user.image} />
        </div>
      </div>

      {/* User Info Section */}
      <div className="flex-1 space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {user.name || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.email}
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-3">
          {user.emailVerified && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </div>
          )}
          
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Member since {formatDate(user.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}