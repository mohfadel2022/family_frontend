import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageTheme } from "@/hooks/usePageTheme";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon | React.ElementType;
  variant?: "primary" | "danger" | "success" | "outline" | "default" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const CustomButton = ({ 
  children, 
  icon: Icon, 
  variant = "primary", 
  size = "default",
  className, 
  isLoading,
  ...props 
}: CustomButtonProps) => {
  const theme = usePageTheme();
  
  // Mapeo de estilos por variante
  const variants = {
    default: "default",
    outline: "bg-muted/50 !text-black hover:bg-accent rounded-2xl px-5 flex gap-3 items-center font-black",
    ghost: "bg-transparent shadow-none hover:bg-muted/50 text-foreground",
    primary: `${theme.primary} hover:${theme.secondary} ${theme.shadow} !text-white`,
    danger: "bg-rose-500 hover:bg-rose-600 shadow-rose-100 !text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 !text-white",
  };

  return (
    <Button
      {...props}
      variant={variant === "outline" || variant === "ghost" || variant === "default" ? variant : "default"}
      size={size}
      disabled={isLoading || props.disabled}
      className={cn(
        "h-12 px-6 rounded-2xl font-black shadow-lg flex gap-2 items-center transition-all active:scale-95",
        variants[variant],
        className
      )}
    >
      {
        Icon && <Icon size={20} />
      }
      {children}
    </Button>
  );
};