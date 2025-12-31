import { LucideIcon, Lock } from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  earnedDate?: string;
  color: string;
}

interface BadgeCardProps {
  badge: Badge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const Icon = badge.icon;

  return (
    <div
      className={`relative bg-card rounded-xl border p-4 text-center transition-all duration-300 ${
        badge.earned
          ? "border-primary/30 hover:shadow-soft"
          : "border-border opacity-60"
      }`}
    >
      <div
        className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
          badge.earned ? badge.color : "bg-muted"
        }`}
      >
        {badge.earned ? (
          <Icon className="w-8 h-8 text-primary-foreground" />
        ) : (
          <Lock className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      <h4 className="font-semibold text-sm text-foreground mb-1">{badge.name}</h4>
      <p className="text-xs text-muted-foreground">{badge.description}</p>

      {badge.earned && badge.earnedDate && (
        <p className="text-xs text-primary mt-2">Earned {badge.earnedDate}</p>
      )}
    </div>
  );
}
