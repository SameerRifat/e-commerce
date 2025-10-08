// src/hooks/use-step-validation.ts
"use client";

import { useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  validateStep,
  canAccessStep,
  isStepCompleted,
  CompleteProductFormData,
} from "@/lib/validations/product-form";

interface UseStepValidationProps {
  form: UseFormReturn<CompleteProductFormData>;
  currentStep: number;
}

interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const useStepValidation = ({ form, currentStep }: UseStepValidationProps) => {
  const formData = form.watch();

  // Helper function to check if user has interacted with a step
  const hasUserInteractedWithStep = useCallback((stepIndex: number): boolean => {
    const isSimpleProduct = formData.productType === 'simple';
    
    switch (stepIndex) {
      case 0: // Basic Info - only consider meaningful interaction
        return !!(formData.name && formData.name.length > 0) || 
               !!(formData.description && formData.description.length > 0);
      case 1: // Pricing/Variants
        if (isSimpleProduct) {
          return !!(formData.sku && formData.sku.length > 0) ||
                 !!(formData.price && formData.price.length > 0);
        } else {
          return formData.variants && formData.variants.length > 0;
        }
      case 2: // Images
        return formData.images && formData.images.length > 0;
      case 3: // Inventory
        if (isSimpleProduct) {
          return formData.inStock !== undefined && formData.inStock !== null;
        } else {
          return formData.variants && formData.variants.some(v => v.inStock !== undefined);
        }
      default:
        return false;
    }
  }, [formData]);

  // Memoized validation results for each step - only show errors if user has interacted
  const stepValidations = useMemo(() => {
    const isSimpleProduct = formData.productType === 'simple';
    const results = {
      basic: validateStep.basic(formData),
      simple: validateStep.simple(formData),
      variants: validateStep.variants(formData),
      images: validateStep.images(formData),
      inventory: validateStep.inventory(formData),
    };

    return {
      0: {
        isValid: results.basic.success,
        errors: hasUserInteractedWithStep(0) && !results.basic.success ? 
          (results.basic.error?.issues || []).map(e => e.message) : [],
        warnings: [],
      },
      1: {
        isValid: isSimpleProduct ? results.simple.success : results.variants.success,
        errors: hasUserInteractedWithStep(1) && 
          (isSimpleProduct ? !results.simple.success : !results.variants.success) ? 
          (isSimpleProduct ? 
            (results.simple.error?.issues || []).map(e => e.message) :
            (results.variants.error?.issues || []).map(e => e.message)
          ) : [],
        warnings: [],
      },
      2: {
        isValid: results.images.success,
        errors: hasUserInteractedWithStep(2) && !results.images.success ? 
          (results.images.error?.issues || []).map(e => e.message) : [],
        warnings: [],
      },
      3: {
        isValid: results.inventory.success,
        errors: hasUserInteractedWithStep(3) && !results.inventory.success ? 
          (results.inventory.error?.issues || []).map(e => e.message) : [],
        warnings: [],
      },
    };
  }, [formData, hasUserInteractedWithStep]);

  // Check which steps are completed
  const completedSteps = useMemo(() => {
    const isSimpleProduct = formData.productType === 'simple';
    const maxSteps = isSimpleProduct ? 3 : 4; // Simple: 0,1,2; Configurable: 0,1,2,3
    const stepIndices = Array.from({ length: maxSteps }, (_, i) => i);
    
    return stepIndices.filter(stepIndex => 
      isStepCompleted(stepIndex, formData)
    );
  }, [formData]);

  // Check which steps can be accessed
  const accessibleSteps = useMemo(() => {
    const isSimpleProduct = formData.productType === 'simple';
    const maxSteps = isSimpleProduct ? 3 : 4; // Simple: 0,1,2; Configurable: 0,1,2,3
    const stepIndices = Array.from({ length: maxSteps }, (_, i) => i);
    
    return stepIndices.filter(stepIndex => 
      canAccessStep(stepIndex, formData)
    );
  }, [formData]);

  // Get validation result for current step
  const currentStepValidation: StepValidationResult = stepValidations[currentStep as keyof typeof stepValidations] || {
    isValid: false,
    errors: ["Invalid step"],
    warnings: [],
  };

  // Check if user can navigate to a specific step
  const canNavigateToStep = useCallback((targetStep: number): boolean => {
    return accessibleSteps.includes(targetStep);
  }, [accessibleSteps]);

  // Check if user can proceed to next step
  const canProceedToNext = useCallback((): boolean => {
    const nextStep = currentStep + 1;
    return canNavigateToStep(nextStep);
  }, [currentStep, canNavigateToStep]);

  // Check if user can go back to previous step
  const canGoToPrevious = useCallback((): boolean => {
    return currentStep > 0;
  }, [currentStep]);

  // Get all validation errors for the form
  const getAllValidationErrors = useCallback((): Record<number, string[]> => {
    return Object.fromEntries(
      Object.entries(stepValidations).map(([step, validation]) => [
        parseInt(step),
        validation.errors,
      ])
    );
  }, [stepValidations]);

  // Check if form is ready for submission
  const isFormReadyForSubmission = useMemo(() => {
    const isSimpleProduct = formData.productType === 'simple';
    const requiredSteps = isSimpleProduct ? 3 : 3; // Simple: basic, pricing, images; Configurable: basic, variants, images (inventory is optional)
    return completedSteps.length >= requiredSteps;
  }, [completedSteps, formData.productType]);

  // Get progress percentage
  const progressPercentage = useMemo(() => {
    const isSimpleProduct = formData.productType === 'simple';
    const totalSteps = isSimpleProduct ? 3 : 4;
    return Math.round((completedSteps.length / totalSteps) * 100);
  }, [completedSteps, formData.productType]);

  // Validate specific field
  const validateField = useCallback(async (fieldName: string): Promise<boolean> => {
    const result = await form.trigger(fieldName as any);
    return result;
  }, [form]);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const isSimpleProduct = formData.productType === 'simple';
    let fieldsToValidate: string[] = [];

    switch (currentStep) {
      case 0: // Basic Info
        fieldsToValidate = ["name", "description", "categoryId", "genderId", "brandId", "isPublished", "productType"];
        break;
      case 1: // Pricing/Variants
        if (isSimpleProduct) {
          fieldsToValidate = ["sku", "price", "salePrice", "inStock", "weight", "dimensions"];
        } else {
          fieldsToValidate = ["variants"];
        }
        break;
      case 2: // Images
        fieldsToValidate = ["images"];
        break;
      case 3: // Inventory
        if (isSimpleProduct) {
          fieldsToValidate = ["inStock"];
        } else {
          fieldsToValidate = ["variants"];
        }
        break;
    }

    if (fieldsToValidate.length === 0) return true;

    const results = await Promise.all(
      fieldsToValidate.map(field => form.trigger(field as any))
    );

    return results.every(result => result);
  }, [currentStep, form, formData.productType]);

  // Get step summary
  const getStepSummary = useCallback((stepIndex: number) => {
    const validation = stepValidations[stepIndex as keyof typeof stepValidations];
    if (!validation) return null;

    return {
      stepIndex,
      isCompleted: completedSteps.includes(stepIndex),
      isAccessible: accessibleSteps.includes(stepIndex),
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }, [stepValidations, completedSteps, accessibleSteps]);

  return {
    // Current step validation
    currentStepValidation,
    
    // Navigation controls
    canNavigateToStep,
    canProceedToNext,
    canGoToPrevious,
    
    // Step status
    completedSteps,
    accessibleSteps,
    
    // Form status
    isFormReadyForSubmission,
    progressPercentage,
    
    // Validation utilities
    validateField,
    validateCurrentStep,
    getAllValidationErrors,
    getStepSummary,
    
    // Raw validation results
    stepValidations,
  };
};
