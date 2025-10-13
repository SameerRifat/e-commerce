// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Product images uploader
  productImageUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 20 }
  })
    .middleware(async () => {
      return { uploadedBy: "dashboard-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Product image upload complete:", file.ufsUrl);
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),

  // Category image uploader
  categoryImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      return { uploadedBy: "dashboard-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Category image upload complete:", file.ufsUrl);
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),

  // Brand logo uploader
  brandLogoUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      return { uploadedBy: "dashboard-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Brand logo upload complete:", file.ufsUrl);
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),

  // Profile image uploader
  profileImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 }
  })
    .middleware(async () => {
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile image upload complete:", file.ufsUrl);
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),

  // Hero slide uploader
  heroSlideUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 2 },
    video: { maxFileSize: "32MB", maxFileCount: 2 }
  })
    .middleware(async () => {
      return { uploadedBy: "dashboard-admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Hero slide upload complete:", file.ufsUrl);
      return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// // src/app/api/uploadthing/core.ts
// import { createUploadthing, type FileRouter } from "uploadthing/next";

// const f = createUploadthing();

// // FileRouter for your app, can contain multiple FileRoutes
// export const ourFileRouter = {
//   // Define as many FileRoutes as you like, each with a unique routeSlug
//   productImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 20 } })
//     // Set permissions and file types for this FileRoute
//     .middleware(async () => {
//       // This code runs on your server before upload
//       // You can add authentication checks here if needed

//       return { uploadedBy: "dashboard-user" }; // Whatever is returned here is accessible in onUploadComplete as `metadata`
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       // This code RUNS ON YOUR SERVER after upload
//       console.log("Upload complete for uploadedBy:", metadata.uploadedBy);

//       console.log("file url", file.ufsUrl);

//       // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
//       return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
//     }),

//   // Category image uploader
//   categoryImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
//     .middleware(async () => {
//       // This code runs on your server before upload
//       return { uploadedBy: "dashboard-user" };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       // This code RUNS ON YOUR SERVER after upload
//       console.log("Category image upload complete for uploadedBy:", metadata.uploadedBy);
//       console.log("Category image file url", file.ufsUrl);

//       return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
//     }),

//   // Brand logo uploader
//   brandLogoUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
//     .middleware(async () => {
//       // This code runs on your server before upload
//       return { uploadedBy: "dashboard-user" };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       // This code RUNS ON YOUR SERVER after upload
//       console.log("Brand logo upload complete for uploadedBy:", metadata.uploadedBy);
//       console.log("Brand logo file url", file.ufsUrl);

//       return { uploadedBy: metadata.uploadedBy, url: file.ufsUrl };
//     }),

//   heroSlideUploader: f({
//     image: { maxFileSize: "8MB", maxFileCount: 2 },
//     video: { maxFileSize: "32MB", maxFileCount: 2 }
//   })
//     .middleware(async () => {
//       // Add authentication check here if needed
//       return { uploadedBy: "dashboard-admin" };
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       console.log("Hero slide upload complete for:", metadata.uploadedBy);
//       console.log("File URL:", file.url);
//       return { uploadedBy: metadata.uploadedBy, url: file.url };
//     }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;
