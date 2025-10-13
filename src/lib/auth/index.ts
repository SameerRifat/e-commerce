// src/lib/auth/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema/index";
import { v4 as uuidv4 } from "uuid";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendPasswordResetEmail({
        email: user.email,
        url,
        token,
      });
    },
    
    resetPasswordTokenExpiresIn: 3600,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendVerificationEmail({
        email: user.email,
        url,
        token,
      });
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },

  socialProviders: {},

  sessions: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // CRITICAL: Include the role field in cookie cache
      include: [
        "user.id",
        "user.name",
        "user.email",
        "user.emailVerified",
        "user.image",
        "user.role", // Make sure this is included!
      ],
    },
  },

  cookies: {
    sessionToken: {
      name: "auth_session",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    },
  },

  advanced: {
    database: {
      generateId: () => uuidv4(),
    },
  },

  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      adminUserIds: [],
    }),
  ],
});

// // src/lib/auth/index.ts
// import { betterAuth } from "better-auth";
// import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import { db } from "@/lib/db";
// import * as schema from "@/lib/db/schema/index";
// import { v4 as uuidv4 } from "uuid";
// import { nextCookies } from "better-auth/next-js";
// import { admin } from "better-auth/plugins";
// import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

// export const auth = betterAuth({
//   database: drizzleAdapter(db, {
//     provider: "pg",
//     schema: {
//       user: schema.users,
//       session: schema.sessions,
//       account: schema.accounts,
//       verification: schema.verifications,
//     },
//   }),

//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: true,
    
//     // Password reset configuration
//     sendResetPassword: async ({ user, url, token }, request) => {
//       await sendPasswordResetEmail({
//         email: user.email,
//         url,
//         token,
//       });
//     },
    
//     // Token expiration: 1 hour (3600 seconds)
//     resetPasswordTokenExpiresIn: 3600,
//   },

//   // Email verification configuration
//   emailVerification: {
//     sendOnSignUp: true,
//     autoSignInAfterVerification: true,
//     sendVerificationEmail: async ({ user, url, token }, request) => {
//       await sendVerificationEmail({
//         email: user.email,
//         url,
//         token,
//       });
//     },
//   },

//   // Add additional fields to user
//   user: {
//     additionalFields: {
//       role: {
//         type: "string",
//         required: false,
//         defaultValue: "user",
//         input: false, // Prevent users from setting this
//       },
//     },
//   },

//   socialProviders: {},

//   sessions: {
//     cookieCache: {
//       enabled: true,
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     },
//   },

//   cookies: {
//     sessionToken: {
//       name: "auth_session",
//       options: {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: 'strict',
//         path: '/',
//         maxAge: 60 * 60 * 24 * 7, // 7 days
//       },
//     },
//   },

//   advanced: {
//     database: {
//       generateId: () => uuidv4(),
//     },
//   },

//   plugins: [
//     nextCookies(),
//     admin({
//       defaultRole: "user",
//       adminRoles: ["admin"],
//       // Add your initial admin user IDs here
//       adminUserIds: [], // e.g., ["uuid-of-admin-user"]
//     }),
//   ],
// });