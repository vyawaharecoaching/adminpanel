import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: "up" | "down";
    text: string;
  };
  color?: "primary" | "secondary" | "accent";
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  color = "primary" 
}: StatCardProps) => {
  const colorClasses = {
    primary: {
      bg: "bg-primary",
      bgLight: "bg-primary/10",
      text: "text-primary",
    },
    secondary: {
      bg: "bg-green-600",
      bgLight: "bg-green-600/10",
      text: "text-green-600",
    },
    accent: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-500/10",
      text: "text-amber-500",
    },
  };

  const trendColor = change?.trend === "up" ? "text-green-600" : "text-red-600";

  return (
    <div className="bg-background rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={cn("text-sm font-medium", trendColor)}>
                {change.trend === "up" ? "↑" : "↓"} {change.value}
              </span>
              <span className="text-gray-600 text-xs ml-1">{change.text}</span>
            </div>
          )}
        </div>
        
        <div className={cn("rounded-full p-3", colorClasses[color].bgLight)}>
          <Icon className={cn("h-6 w-6", colorClasses[color].text)} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
