// src/components/loading/section-loader.tsx
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface SectionLoaderProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function SectionLoader({ className, size = "md" }: SectionLoaderProps) {
    const sizeClasses = {
        sm: "min-h-[200px] size-6",
        md: "min-h-[300px] size-8",
        lg: "min-h-[400px] size-10",
    };

    return (
        <div className={cn(
            "flex w-full items-center justify-center",
            sizeClasses[size].split(' ')[0],
            className
        )}>
            <Spinner className={sizeClasses[size].split(' ')[1]} />
        </div>
    );
}
