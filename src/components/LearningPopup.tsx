import { X, Lightbulb, AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export type PopupType = "warning" | "explanation" | "tip" | "longterm";

interface LearningPopupProps {
  type: PopupType;
  title: string;
  message: string;
  onClose: () => void;
}

const popupConfig: Record<PopupType, { icon: LucideIcon; bgClass: string; iconClass: string }> = {
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-warning/10 border-warning/30",
    iconClass: "text-warning-foreground bg-warning/20",
  },
  explanation: {
    icon: Lightbulb,
    bgClass: "bg-info/10 border-info/30",
    iconClass: "text-info bg-info/20",
  },
  tip: {
    icon: Lightbulb,
    bgClass: "bg-success/10 border-success/30",
    iconClass: "text-success bg-success/20",
  },
  longterm: {
    icon: Clock,
    bgClass: "bg-primary/10 border-primary/30",
    iconClass: "text-primary bg-primary/20",
  },
};

export function LearningPopup({ type, title, message, onClose }: LearningPopupProps) {
  const config = popupConfig[type];
  const Icon = config.icon;

  return (
    <div className={`relative rounded-xl border p-4 ${config.bgClass} animate-slide-up`}>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-background/50 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.iconClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6">
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          <Button variant="ghost" size="sm" className="mt-2 h-8 text-primary">
            Learn More →
          </Button>
        </div>
      </div>
    </div>
  );
}
