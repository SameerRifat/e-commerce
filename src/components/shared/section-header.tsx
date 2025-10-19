// src/components/shared/section-header.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    className?: string;
}

export default function SectionHeader({
    title,
    subtitle,
    viewAllHref,
    viewAllLabel = 'View All',
    className = '',
}: SectionHeaderProps) {
    return (
        <div className={`flex justify-between items-start flex-wrap gap-4 mb-5 ${className}`}>
            {/* Left: Title & Subtitle */}
            <div>
                <h2 className="text-lg sm:text-xl 2xl:text-2xl font-medium mb-2 leading-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs sm:text-sm lg:text-base text-muted-foreground hidden sm:block">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right: View All Link */}
            {viewAllHref && (
                <Link
                    href={viewAllHref}
                    className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                >
                    {viewAllLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            )}
        </div>
    );
}