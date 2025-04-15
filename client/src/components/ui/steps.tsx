import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: string[];
  currentStep: number;
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ steps, currentStep, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full justify-between", className)}
        {...props}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center",
              index < steps.length - 1 ? "flex-1" : ""
            )}
          >
            <div className="flex items-center relative">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  index < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "border-primary text-primary"
                    : "border-neutral-300 text-neutral-300"
                )}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 h-0.5 w-full -right-1/2 z-[-1]",
                    index < currentStep
                      ? "bg-primary"
                      : "bg-neutral-300"
                  )}
                />
              )}
            </div>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-sm font-medium",
                  index <= currentStep
                    ? "text-primary"
                    : "text-neutral-500"
                )}
              >
                {step}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

Steps.displayName = "Steps";

export { Steps };