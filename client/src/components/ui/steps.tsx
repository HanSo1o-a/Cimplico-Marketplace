import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep?: number;
  children: React.ReactNode;
}

export interface StepProps extends React.HTMLAttributes<HTMLLIElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, currentStep = 0, children, ...props }, ref) => {
    // Clone children to add step numbers and active status
    const childrenArray = React.Children.toArray(children).filter(Boolean);
    const stepsWithProps = React.Children.map(childrenArray, (child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          stepNumber: index + 1,
          isActive: index === currentStep,
          isCompleted: index < currentStep,
        });
      }
      return child;
    });

    return (
      <div 
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        <ol className="relative flex flex-wrap items-center w-full">
          {stepsWithProps}
        </ol>
      </div>
    );
  }
);

Steps.displayName = "Steps";

export const Step = React.forwardRef<
  HTMLLIElement,
  StepProps & { stepNumber?: number; isActive?: boolean; isCompleted?: boolean }
>(
  ({ 
    className, 
    title, 
    description, 
    icon, 
    stepNumber, 
    isActive = false, 
    isCompleted = false,
    ...props 
  }, ref) => {
    const isFirst = stepNumber === 1;
    const isLast = React.isValidElement(props.children) && !props.children;

    return (
      <li 
        ref={ref}
        className={cn(
          "relative flex-1 flex items-center",
          !isLast && "after:content-[''] after:w-full after:h-0.5 after:border-b after:border-gray-200 after:border-1 after:mx-2 after:inline-block",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full shrink-0 z-10",
            isCompleted ? "bg-primary" : 
            isActive ? "bg-primary border-4 border-primary/20" : 
            "bg-gray-200"
          )}>
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <span className={cn(
                "text-sm font-medium",
                isActive ? "text-white" : "text-gray-500"
              )}>
                {stepNumber}
              </span>
            )}
          </div>
          <div className="text-center mt-2">
            <h3 className={cn(
              "text-sm font-medium",
              isActive || isCompleted ? "text-gray-900" : "text-gray-500"
            )}>
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </li>
    );
  }
);

Step.displayName = "Step";