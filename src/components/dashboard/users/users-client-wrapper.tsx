// src/components/dashboard/users/users-client-wrapper.tsx
"use client";

import React, { useState } from "react";
import { Users as UsersIcon } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import UsersSearch from "./users-search";
import UsersTable from "./users-table";
import UsersFilters from "./users-filters";
import UserRoleDialog from "./user-role-dialog";
import { type UserWithStats } from "@/lib/actions/user-management";

interface UsersClientWrapperProps {
  initialUsers: UserWithStats[];
  currentFilters: {
    role: string;
    emailVerified: string;
    sortBy: string;
    sortOrder: string;
  };
}

const UsersClientWrapper: React.FC<UsersClientWrapperProps> = ({
  initialUsers,
  currentFilters,
}) => {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);

  const handleEditRole = (user: UserWithStats) => {
    setEditingUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleRoleDialogChange = (open: boolean) => {
    setIsRoleDialogOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  const handleRoleUpdateSuccess = () => {
    setEditingUser(null);
  };

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and permissions"
      >
        <div className="flex flex-col gap-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <UsersSearch />
            <UsersFilters currentFilters={currentFilters} />
          </div>
        </div>
      </PageHeader>

      {/* Users Table with server-side data */}
      <UsersTable 
        users={initialUsers}
        onEditRole={handleEditRole}
        loading={false}
      />

      {/* Edit Role Dialog */}
      <UserRoleDialog
        open={isRoleDialogOpen}
        onOpenChange={handleRoleDialogChange}
        onSuccess={handleRoleUpdateSuccess}
        user={editingUser ?? undefined}
      />
    </>
  );
};

export default UsersClientWrapper;