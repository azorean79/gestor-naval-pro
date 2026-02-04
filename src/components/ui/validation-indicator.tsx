"use client";

import { memo } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'success';
}

interface ValidationIndicatorProps {
  result: ValidationResult;
  className?: string;
}

export const ValidationIndicator = memo(function ValidationIndicator({ result, className }: ValidationIndicatorProps) {
  if (!result.message) return null;

  const Icon = result.severity === 'success' ? CheckCircle :
               result.severity === 'warning' ? AlertCircle : XCircle;

  const colorClass = result.severity === 'success' ? 'text-green-600' :
                     result.severity === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={cn('flex items-center gap-1 text-sm', colorClass, className)}>
      <Icon className="h-4 w-4" />
      <span>{result.message}</span>
    </div>
  );
});