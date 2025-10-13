// // src/middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export async function middleware(request: NextRequest) {
//     const { pathname } = request.nextUrl;

//     // Protect dashboard routes (admin only)
//     if (pathname.startsWith("/dashboard")) {
//         try {
//             // Check if session token exists
//             const sessionToken = request.cookies.get("better-auth.session_token");

//             if (!sessionToken?.value) {
//                 const signInUrl = new URL("/sign-in", request.url);
//                 signInUrl.searchParams.set("redirectTo", pathname);
//                 return NextResponse.redirect(signInUrl);
//             }

//             // Validate session by calling the API endpoint
//             const baseUrl = request.nextUrl.origin;
//             const response = await fetch(`${baseUrl}/api/auth/get-session`, {
//                 headers: {
//                     cookie: request.headers.get("cookie") || "",
//                 },
//                 cache: "no-store",
//             });

//             if (!response.ok) {
//                 const signInUrl = new URL("/sign-in", request.url);
//                 signInUrl.searchParams.set("redirectTo", pathname);
//                 return NextResponse.redirect(signInUrl);
//             }

//             const data = await response.json();

//             console.log("Session data:", data);

//             // Check if user has admin role
//             if (!data?.user || data.user.role !== "admin") {
//                 return NextResponse.redirect(new URL("/", request.url));
//             }

//             return NextResponse.next();
//         } catch (error) {
//             console.error("Middleware auth error:", error);
//             const signInUrl = new URL("/sign-in", request.url);
//             signInUrl.searchParams.set("redirectTo", pathname);
//             return NextResponse.redirect(signInUrl);
//         }
//     }

//     return NextResponse.next();
// }

// export const config = {
//     matcher: ["/dashboard/:path*"],
// };