// src/types/auth.ts
export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    role: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Session {
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    };
    user: User;
}