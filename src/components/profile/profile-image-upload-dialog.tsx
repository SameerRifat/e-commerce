// src/components/profile/profile-image-upload-dialog.tsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUploadThing } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { updateProfileImage } from '@/lib/actions/profile';
import { useRouter } from 'next/navigation';

interface ProfileImageUploadDialogProps {
  userId: string;
  currentImage: string | null;
}

export default function ProfileImageUploadDialog({
  userId,
  currentImage,
}: ProfileImageUploadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { startUpload } = useUploadThing('profileImageUploader', {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url;
        
        try {
          const result = await updateProfileImage(userId, uploadedUrl);
          
          if (result.success) {
            toast.success('Profile image updated successfully!');
            setOpen(false);
            setPreviewUrl(null);
            setUploadProgress(0);
            router.refresh(); // Modern approach instead of window.location.reload()
          } else {
            toast.error(result.message || 'Failed to update profile image');
            setPreviewUrl(null);
          }
        } catch (error) {
          console.error('Profile image update error:', error);
          toast.error('Failed to update profile image');
          setPreviewUrl(null);
        } finally {
          setIsUploading(false);
        }
      }
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setIsUploading(false);
      setPreviewUrl(null);
      setUploadProgress(0);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image must be less than 4MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      await startUpload([file]);
    } catch (error) {
      console.error('Upload failed:', error);
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreviewUrl(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleRemovePreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const hasPreview = previewUrl && previewUrl.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="h-9 w-9 rounded-full border-2 border-background bg-primary hover:bg-primary/90 shadow-lg"
          aria-label="Change profile picture"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a new profile picture. Recommended: Square image, 400x400px or larger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview/Upload Area */}
          <div 
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-dashed border-muted-foreground/25 bg-muted/30"
            )}
          >
            {hasPreview ? (
              <div className="relative h-full w-full">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <p className="mt-3 text-sm font-medium text-white">Uploading...</p>
                    <div className="mt-3 w-32">
                      <Progress value={uploadProgress} className="h-1.5" />
                      <p className="mt-1 text-center text-xs text-white/80">
                        {uploadProgress}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  'flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center transition-colors',
                  isDragActive && 'bg-primary/10',
                  isUploading && 'cursor-not-allowed opacity-50'
                )}
              >
                <input {...getInputProps()} />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop your image here' : 'Drop image here or click to browse'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP up to 4MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {hasPreview && !isUploading && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRemovePreview}
                className="flex-1"
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
              <Button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                  input?.click();
                }}
                className="flex-1"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Different
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


// // src/components/profile/profile-image-upload-dialog.tsx
// 'use client';

// import { useState } from 'react';
// import { useDropzone } from 'react-dropzone';
// import { Upload, X, Loader2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Progress } from '@/components/ui/progress';
// import { cn } from '@/lib/utils';
// import { useUploadThing } from '@/lib/uploadthing';
// import { toast } from 'sonner';
// import { updateProfileImage } from '@/lib/actions/profile';

// interface ProfileImageUploadDialogProps {
//   userId: string;
//   currentImage: string | null;
// }

// export default function ProfileImageUploadDialog({
//   userId,
//   currentImage,
// }: ProfileImageUploadDialogProps) {
//   const [open, setOpen] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);

//   const { startUpload } = useUploadThing('profileImageUploader', {
//     onClientUploadComplete: async (res) => {
//       if (res && res[0]) {
//         const uploadedUrl = res[0].url;
        
//         try {
//           const result = await updateProfileImage(userId, uploadedUrl);
          
//           if (result.success) {
//             toast.success('Profile image updated successfully!');
//             setOpen(false);
//             setPreviewUrl(null);
//             setUploadProgress(0);
//             // Trigger page refresh to show updated image
//             window.location.reload();
//           } else {
//             toast.error(result.message || 'Failed to update profile image');
//             setPreviewUrl(null);
//           }
//         } catch (error) {
//           console.error('Profile image update error:', error);
//           toast.error('Failed to update profile image');
//           setPreviewUrl(null);
//         } finally {
//           setIsUploading(false);
//         }
//       }
//     },
//     onUploadError: (error) => {
//       console.error('Upload error:', error);
//       toast.error('Failed to upload image');
//       setIsUploading(false);
//       setPreviewUrl(null);
//       setUploadProgress(0);
//     },
//     onUploadProgress: (progress) => {
//       setUploadProgress(progress);
//     },
//   });

//   const onDrop = async (acceptedFiles: File[]) => {
//     if (acceptedFiles.length === 0) return;

//     const file = acceptedFiles[0];
//     setIsUploading(true);
//     setUploadProgress(0);

//     // Create preview
//     const preview = URL.createObjectURL(file);
//     setPreviewUrl(preview);

//     try {
//       await startUpload([file]);
//     } catch (error) {
//       console.error('Upload failed:', error);
//       if (preview.startsWith('blob:')) {
//         URL.revokeObjectURL(preview);
//       }
//       setPreviewUrl(null);
//       setIsUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif'],
//     },
//     maxFiles: 1,
//     disabled: isUploading,
//   });

//   const handleRemoveImage = () => {
//     if (previewUrl && previewUrl.startsWith('blob:')) {
//       URL.revokeObjectURL(previewUrl);
//     }
//     setPreviewUrl(null);
//   };

//   const hasPreview = previewUrl && previewUrl.length > 0;

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button
//           size="icon"
//           className="h-8 w-8 rounded-full border-2 border-background bg-primary/90 hover:bg-primary"
//           aria-label="Upload profile picture"
//         >
//           <Upload className="h-4 w-4" />
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle>Update Profile Picture</DialogTitle>
//           <DialogDescription>
//             Upload a new profile picture. Recommended size: 200x200px or larger.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Preview Area */}
//           <div className="aspect-square overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
//             {hasPreview ? (
//               <div className="relative h-full w-full">
//                 <img
//                   src={previewUrl}
//                   alt="Preview"
//                   className="h-full w-full object-cover"
//                 />
//                 {isUploading && (
//                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
//                     <Loader2 className="h-6 w-6 animate-spin text-white" />
//                     <p className="mt-2 text-xs text-white">Uploading...</p>
//                     <Progress value={uploadProgress} className="mt-2 h-2 w-20" />
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div
//                 {...getRootProps()}
//                 className={cn(
//                   'flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center',
//                   isDragActive && 'bg-primary/10 text-primary',
//                   isUploading && 'cursor-not-allowed opacity-50'
//                 )}
//               >
//                 <input {...getInputProps()} />
//                 <Upload className="h-8 w-8 text-muted-foreground" />
//                 <div className="space-y-1">
//                   <p className="text-sm font-medium text-foreground">
//                     {isDragActive
//                       ? 'Drop your image here'
//                       : 'Drag and drop your image here'}
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     or click to select
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Supported Formats */}
//           <p className="text-xs text-muted-foreground">
//             Supported formats: JPEG, PNG, WebP, AVIF (max 4MB)
//           </p>

//           {/* Actions */}
//           <div className="flex gap-2">
//             {hasPreview ? (
//               <>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handleRemoveImage}
//                   disabled={isUploading}
//                   className="flex-1"
//                 >
//                   <X className="mr-2 h-4 w-4" />
//                   Remove
//                 </Button>
//                 <Button
//                   disabled={isUploading}
//                   className="flex-1"
//                   onClick={() => {
//                     /* Upload is already in progress via onClientUploadComplete */
//                   }}
//                 >
//                   {isUploading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Uploading...
//                     </>
//                   ) : (
//                     <>
//                       <Upload className="mr-2 h-4 w-4" />
//                       Upload
//                     </>
//                   )}
//                 </Button>
//               </>
//             ) : (
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="w-full"
//                 disabled={isUploading}
//                 onClick={() => {
//                   document.querySelector('input[type="file"]')?.click();
//                 }}
//               >
//                 <Upload className="mr-2 h-4 w-4" />
//                 Choose Image
//               </Button>
//             )}
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }