// src/components/CollapsibleSection.tsx
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface CollapsibleSectionProps {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  rightMeta?: React.ReactNode;
  className?: string;
  value?: string; // For accordion value control
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  rightMeta,
  className = "",
  value = "item-1",
}: CollapsibleSectionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? value : undefined}
      className={`border-b border-light-300 ${className}`}
    >
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger className="py-5 text-body-medium text-dark-900 hover:no-underline">
          <div className="flex w-full items-center justify-between pr-4">
            <span>{title}</span>
            {rightMeta && <span className="flex items-center gap-2">{rightMeta}</span>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-6 text-body text-dark-700">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}