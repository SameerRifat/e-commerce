// src/components/dashboard/products/components/StepNavigation.tsx
"use client";

import React from "react";
import { LucideIcon, Check, AlertCircle, Lock } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Step {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface StepSummary {
  stepIndex: number;
  isCompleted: boolean;
  isAccessible: boolean;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  accessibleSteps: number[];
  onStepChange: (stepIndex: number) => void;
  getStepSummary: (stepIndex: number) => StepSummary | null;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStep,
  completedSteps,
  accessibleSteps,
  onStepChange,
  getStepSummary,
}) => {
  return (
    <TooltipProvider>
      <div className="border-b">
        <TabsList className="grid w-full grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;
            const isAccessible = accessibleSteps.includes(index);
            const summary = getStepSummary(index);
            const hasErrors = summary?.errorCount && summary.errorCount > 0;
            const hasWarnings = summary?.warningCount && summary.warningCount > 0;
            
            const getStepIcon = () => {
              if (isCompleted) return <Check className="h-3 w-3" />;
              if (!isAccessible) return <Lock className="h-3 w-3" />;
              return <Icon className="h-3 w-3" />;
            };

            const getStepStyle = () => {
              if (isCompleted) return 'bg-green-500 text-white';
              if (isCurrent) return 'bg-blue-500 text-white';
              if (!isAccessible) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
              return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
            };

            const getTooltipContent = () => {
              if (!isAccessible) {
                return "Complete previous steps to unlock";
              }
              if (isCompleted) {
                return "Step completed successfully";
              }
              return null;
            };

            const tooltipContent = getTooltipContent();
            
            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value={step.id}
                    className={`flex items-center gap-2 relative ${!isAccessible ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => isAccessible && onStepChange(index)}
                    disabled={!isAccessible}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs transition-all ${getStepStyle()}`}>
                      {getStepIcon()}
                    </div>
                    <span className="hidden sm:inline">{step.label}</span>
                  </TabsTrigger>
                </TooltipTrigger>
                {tooltipContent && (
                  <TooltipContent>
                    <div className="max-w-xs text-sm whitespace-pre-line">
                      {tooltipContent}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TabsList>
      </div>
    </TooltipProvider>
  );
};

export default StepNavigation;
