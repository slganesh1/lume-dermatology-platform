import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProfileProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarProfile({ 
  src, 
  name, 
  size = "md", 
  className 
}: AvatarProfileProps) {
  const initials = getInitials(name);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg"
  };
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="bg-primary-100 text-primary-600">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
