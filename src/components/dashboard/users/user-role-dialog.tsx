// src/components/dashboard/users/user-role-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateUserRole, type UserWithStats } from "@/lib/actions/user-management";
import { toast } from "sonner";

interface UserRoleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    user?: UserWithStats;
}

const UserRoleDialog: React.FC<UserRoleDialogProps> = ({
    open,
    onOpenChange,
    onSuccess,
    user,
}) => {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update selected role when user changes
    useEffect(() => {
        if (user) {
            setSelectedRole(user.role as "user" | "admin");
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        // Check if role has actually changed
        if (selectedRole === user.role) {
            toast.info("No changes to save");
            onOpenChange(false);
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await updateUserRole(user.id, selectedRole);

            if (result.success) {
                toast.success(`User role updated to ${selectedRole}`);
                router.refresh();
                onOpenChange(false);

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(result.error || "Failed to update user role");
            }
        } catch (error) {
            console.error("Error updating user role:", error);
            toast.error("Failed to update user role");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (!isSubmitting) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Update the role for {user?.name || user?.email}. This will affect their permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* User Info */}
                        <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-sm font-medium text-gray-900">
                                {user?.name || "Unnamed User"}
                            </div>
                            <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>

                        {/* Role Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value) => setSelectedRole(value as "user" | "admin")}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="role" className="!h-12">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">User</span>
                                            <span className="text-xs text-gray-500">Standard customer account</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">Admin</span>
                                            <span className="text-xs text-gray-500">Full dashboard access</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Warning Message */}
                        {selectedRole === "admin" && user?.role === "user" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                <p className="text-sm text-amber-800">
                                    ⚠️ This user will gain full access to the admin dashboard.
                                </p>
                            </div>
                        )}

                        {selectedRole === "user" && user?.role === "admin" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <p className="text-sm text-blue-800">
                                    ℹ️ This user will lose access to the admin dashboard.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Role"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UserRoleDialog;