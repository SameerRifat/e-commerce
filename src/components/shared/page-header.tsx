// src/components/shared/page-header.tsx
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    className = '',
}: PageHeaderProps) {
    return (
        <div className={`flex flex-col mb-3 sm:mb-5 ${className}`}>
            <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-semibold leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground block mt-2">
                    {subtitle}
                </p>
            )}
        </div>
    );
}