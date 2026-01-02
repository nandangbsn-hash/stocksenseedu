import { 
  Lock, Trophy, Target, Shield, Clock, Layers, TrendingUp, Zap, 
  Award, Star, Flame, Heart, BookOpen, Wallet, PiggyBank, Gem,
  Crown, Medal, Rocket, CheckCircle, Brain, GraduationCap, Repeat,
  Sparkles, Gift, Coins, BadgeCheck, CircleDollarSign
} from "lucide-react";
import { UserBadge } from "@/hooks/useChallenges";
import { format } from "date-fns";

interface BadgeCardProps {
  badge: UserBadge;
}

// Map icon names to actual icons (case-insensitive)
const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  Trophy: Trophy,
  target: Target,
  Target: Target,
  shield: Shield,
  Shield: Shield,
  clock: Clock,
  Clock: Clock,
  layers: Layers,
  Layers: Layers,
  trending_up: TrendingUp,
  TrendingUp: TrendingUp,
  zap: Zap,
  Zap: Zap,
  award: Award,
  Award: Award,
  star: Star,
  Star: Star,
  flame: Flame,
  Flame: Flame,
  heart: Heart,
  Heart: Heart,
  book_open: BookOpen,
  BookOpen: BookOpen,
  wallet: Wallet,
  Wallet: Wallet,
  piggy_bank: PiggyBank,
  PiggyBank: PiggyBank,
  gem: Gem,
  Gem: Gem,
  crown: Crown,
  Crown: Crown,
  medal: Medal,
  Medal: Medal,
  rocket: Rocket,
  Rocket: Rocket,
  check_circle: CheckCircle,
  CheckCircle: CheckCircle,
  brain: Brain,
  Brain: Brain,
  graduation_cap: GraduationCap,
  GraduationCap: GraduationCap,
  repeat: Repeat,
  Repeat: Repeat,
  sparkles: Sparkles,
  Sparkles: Sparkles,
  gift: Gift,
  Gift: Gift,
  coins: Coins,
  Coins: Coins,
  badge_check: BadgeCheck,
  BadgeCheck: BadgeCheck,
  circle_dollar_sign: CircleDollarSign,
  CircleDollarSign: CircleDollarSign,
};

const categoryColors: Record<string, string> = {
  achievement: "from-primary to-secondary",
  milestone: "from-success to-emerald-400",
  learning: "from-blue-500 to-cyan-400",
  trading: "from-amber-500 to-orange-400",
  default: "from-primary to-secondary",
};

export function BadgeCard({ badge }: BadgeCardProps) {
  const Icon = iconMap[badge.icon_name] || Award;
  const gradientClass = categoryColors[badge.category || "default"] || categoryColors.default;

  return (
    <div
      className={`relative bg-card rounded-xl border p-4 text-center transition-all duration-300 ${
        badge.earned
          ? "border-primary/30 hover:shadow-soft hover:scale-105"
          : "border-border opacity-60"
      }`}
    >
      {/* Badge Icon Container */}
      <div
        className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
          badge.earned 
            ? `bg-gradient-to-br ${gradientClass}` 
            : "bg-muted"
        }`}
      >
        {badge.earned ? (
          <Icon className="w-8 h-8 text-white" />
        ) : (
          <Lock className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      {/* Badge Name */}
      <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">{badge.name}</h4>
      
      {/* Badge Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{badge.description}</p>

      {/* Earned Date */}
      {badge.earned && badge.earned_at && (
        <p className="text-xs text-primary mt-2 font-medium">
          Earned {format(new Date(badge.earned_at), "MMM d, yyyy")}
        </p>
      )}

      {/* Glow effect for earned badges */}
      {badge.earned && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
      )}
    </div>
  );
}
