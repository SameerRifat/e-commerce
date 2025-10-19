// src/components/auth/reset-password-form.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

const resetPasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(128, "Password is too long"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type Props = {
    token: string;
    onSubmit: (
        newPassword: string,
        token: string
    ) => Promise<{ ok: boolean; message?: string }>;
};

export default function ResetPasswordForm({ token, onSubmit }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    const handleSubmit = async (values: ResetPasswordFormValues) => {
        setIsLoading(true);

        try {
            const result = await onSubmit(values.newPassword, token);

            if (result.ok) {
                setIsSuccess(true);
                toast.success("Password reset successfully!");

                // Redirect to sign in after 2 seconds
                setTimeout(() => {
                    router.push("/sign-in");
                }, 2000);
            } else {
                toast.error(result.message || "Failed to reset password");
            }
        } catch (error) {
            console.error("Reset password error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "An error occurred. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-6">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-heading-3 text-dark-900">Password Reset!</h1>
                    <p className="text-body text-dark-700">
                        Your password has been successfully reset.
                    </p>
                    <p className="text-caption text-dark-700">
                        Redirecting you to sign in...
                    </p>
                </div>

                <Button asChild className="w-full">
                    <Link href="/sign-in">Continue to Sign In</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-heading-3 text-dark-900">Reset Your Password</h1>
                <p className="mt-1 text-body text-dark-700">
                    Enter your new password below
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                >
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-caption text-dark-900">
                                    New Password
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="minimum 8 characters"
                                            autoComplete="new-password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute inset-y-0 right-0 px-3 text-dark-700 hover:bg-transparent hover:text-dark-900"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={
                                                showPassword ? "Hide password" : "Show password"
                                            }
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-caption text-dark-900">
                                    Confirm Password
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="confirm your password"
                                            autoComplete="new-password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute inset-y-0 right-0 px-3 text-dark-700 hover:bg-transparent hover:text-dark-900"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            aria-label={
                                                showConfirmPassword ? "Hide password" : "Show password"
                                            }
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="mt-2 w-full cursor-pointer"
                        disabled={isLoading}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>
            </Form>

            <div className="text-center">
                <p className="text-caption text-dark-700">
                    Remember your password?{" "}
                    <Link
                        href="/sign-in"
                        className="underline hover:text-dark-900 transition-colors"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}