import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-small font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-blue-400/30 bg-gradient-to-r from-primary to-blue-500 text-neutral-50 shadow-[0_10px_26px_rgb(37_99_235/0.22)] hover:brightness-110 hover:shadow-[0_12px_30px_rgb(37_99_235/0.34)]",
        secondary: "border border-border bg-surface/90 text-neutral-50 hover:border-blue-400/30 hover:bg-surface-elevated",
        ghost: "text-neutral-300 hover:bg-surface hover:text-neutral-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}
