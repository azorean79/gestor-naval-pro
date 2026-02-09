"use client";

import { useState, useEffect } from 'react';

interface ValidationField {
  name: string;
  value: unknown;
  rules: ValidationRule[];
}

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'success';
}

export function useRealTimeValidation(fields: ValidationField[]) {
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  const validateField = (field: ValidationField): ValidationResult => {
    for (const rule of field.rules) {
      switch (rule.type) {
        case 'required':
          if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
            return { isValid: false, message: rule.message, severity: 'error' };
          }
          break;

        case 'min':
          if (typeof rule.value === 'number') {
            if (typeof field.value === 'number' && field.value < rule.value) {
              return { isValid: false, message: rule.message, severity: 'error' };
            }
            if (typeof field.value === 'string' && field.value.length < rule.value) {
              return { isValid: false, message: rule.message, severity: 'error' };
            }
          }
          break;

        case 'max':
          if (typeof rule.value === 'number') {
            if (typeof field.value === 'number' && field.value > rule.value) {
              return { isValid: false, message: rule.message, severity: 'error' };
            }
            if (typeof field.value === 'string' && field.value.length > rule.value) {
              return { isValid: false, message: rule.message, severity: 'error' };
            }
          }
          break;

        case 'pattern':
          if (rule.value instanceof RegExp && typeof field.value === 'string' && !rule.value.test(field.value)) {
            return { isValid: false, message: rule.message, severity: 'error' };
          }
          break;

        case 'custom':
          if (rule.validator && !rule.validator(field.value)) {
            return { isValid: false, message: rule.message, severity: 'error' };
          }
          break;
      }
    }

    // Se passou todas as validações
    return { isValid: true, severity: 'success' };
  };

  useEffect(() => {
    const results: Record<string, ValidationResult> = {};

    fields.forEach(field => {
      const result = validateField(field);
      results[field.name] = result;
    });

    setValidationResults(results);
  }, [fields]);

  const isFormValid = Object.values(validationResults).every(result => result.isValid);

  return { validationResults, isFormValid };
}