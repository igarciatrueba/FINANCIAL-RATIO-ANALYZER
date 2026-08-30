import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-md px-5 py-2.5 text-small font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "border border-blue-300/45 bg-[linear-gradient(135deg,#3b82f6,#2563eb_54%,#1d4ed8)] text-neutral-50 shadow-[inset_0_1px_0_rgb(255_255_255/0.24),inset_0_-1px_0_rgb(15_23_42/0.34),0_12px_30px_rgb(37_99_235/0.26)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-blue-100/70 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_16px_34px_rgb(37_99_235/0.34)]",
        secondary: "border border-blue-200/18 bg-[linear-gradient(135deg,rgb(25_42_72/0.68),rgb(14_18_24/0.84))] text-neutral-50 shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_8px_22px_rgb(0_0_0/0.16)] backdrop-blur-md hover:-translate-y-0.5 hover:border-blue-300/42 hover:bg-blue-500/10 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_12px_28px_rgb(37_99_235/0.16)]",
        ghost: "text-neutral-300 hover:bg-blue-400/8 hover:text-neutral-50",
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
