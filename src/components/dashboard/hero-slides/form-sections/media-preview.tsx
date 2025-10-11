// src/components/dashboard/hero-slides/form-sections/media-preview.tsx
import React from "react";

interface MediaPreviewProps {
    src: string;
    type: "image" | "video";
    aspectRatio: string;
    target: "desktop" | "mobile";
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
    src,
    type,
    aspectRatio,
    target,
}) => {
    const containerClass = target === "desktop"
        ? "relative w-full rounded-lg overflow-hidden border bg-gray-100"
        : "relative w-64 rounded-lg overflow-hidden border bg-gray-100 mx-auto";

    return (
        <div className={containerClass} style={{ aspectRatio }}>
            {type === "image" ? (
                <img
                    src={src}
                    alt={`${target} preview`}
                    className="w-full h-full object-cover"
                />
            ) : (
                <video
                    src={src}
                    className="w-full h-full object-cover"
                    controls
                />
            )}
        </div>
    );
};

export default MediaPreview;