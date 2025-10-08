"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PageHeaderProps } from "@/types/dashboard";

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-4 pb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {action && (
          action.href ? (
            <Button asChild className="flex items-center gap-2">
              <Link href={action.href}>
                {action.icon}
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="flex items-center gap-2">
              {action.icon}
              {action.label}
            </Button>
          )
        )}
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
