// src/app/api/auth/get-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return NextResponse.json(
                { user: null },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role,
            },
        });
    } catch (error) {
        console.error("Session validation error:", error);
        return NextResponse.json(
            { user: null },
            { status: 500 }
        );
    }
}