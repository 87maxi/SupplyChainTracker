"use client";

import { LifecycleStep, LifecycleStepDetails, LifecycleStepLabels } from "@/lib/types";
import { ChevronDown, ChevronUp, CheckCircle2, CircleDashed, AlertCircle } from "lucide-react";
import { useState } from "react";

interface LifecycleProgressProps {
  currentStep: LifecycleStep;
  details: LifecycleStepDetails[];
  onStepClick?: (step: LifecycleStep) => void;
}

/**
 * @description Componente para mostrar el progreso del ciclo de vida de una netbook.
 * @param currentStep El paso actual del ciclo de vida.
 * @param details Detalles para cada paso del ciclo de vida.
 * @param onStepClick Callback al hacer clic en un paso.
 */
export const LifecycleProgress = ({
  currentStep,
  details,
  onStepClick,
}: LifecycleProgressProps) => {
  const [expandedStep, setExpandedStep] = useState<LifecycleStep | null>(null);

  const toggleStep = (step: LifecycleStep) => {
    setExpandedStep(expandedStep === step ? null : step);
    onStepClick?.(step);
  };

  const getStepIcon = (step: LifecycleStep) => {
    if (step < currentStep) {
      return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    }
    if (step === currentStep) {
      return <AlertCircle className="h-6 w-6 text-blue-500" />;
    }
    return <CircleDashed className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {Object.values(LifecycleStep).map((step) => {
        const stepDetails = details[step];
        const isExpanded = expandedStep === step;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div
            key={step}
            className={`border rounded-lg p-4 ${isCurrent ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleStep(step)}
            >
              <div className="flex items-center space-x-3">
                {getStepIcon(step)}
                <div>
                  <h3 className={`font-medium ${isCompleted ? "text-gray-500" : "text-gray-900"}`}>
                    {LifecycleStepLabels[step]}
                  </h3>
                  <p className={`text-sm ${isCompleted ? "text-gray-400" : "text-gray-600"}`}>
                    {stepDetails.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
            {isExpanded && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Details</h4>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  {stepDetails.auditor && (
                    <p>
                      <span className="font-medium">Auditor:</span> {stepDetails.auditor}
                    </p>
                  )}
                  {stepDetails.auditResult && (
                    <p>
                      <span className="font-medium">Audit Result:</span> {stepDetails.auditResult}
                    </p>
                  )}
                  {stepDetails.technician && (
                    <p>
                      <span className="font-medium">Technician:</span> {stepDetails.technician}
                    </p>
                  )}
                  {stepDetails.osVersion && (
                    <p>
                      <span className="font-medium">OS Version:</span> {stepDetails.osVersion}
                    </p>
                  )}
                  {stepDetails.validationResult && (
                    <p>
                      <span className="font-medium">Validation Result:</span> {stepDetails.validationResult}
                    </p>
                  )}
                  {stepDetails.school && (
                    <p>
                      <span className="font-medium">School:</span> {stepDetails.school}
                    </p>
                  )}
                  {stepDetails.studentId && (
                    <p>
                      <span className="font-medium">Student ID:</span> {stepDetails.studentId}
                    </p>
                  )}
                  {stepDetails.timestamp && (
                    <p>
                      <span className="font-medium">Timestamp:</span> {new Date(Number(stepDetails.timestamp) * 1000).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
