import { Trophy, Clock, CheckCircle2, Lock, ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Challenge } from "@/hooks/useChallenges";

interface ChallengeCardProps {
  challenge: Challenge;
  onStart: (challenge: Challenge) => void;
  participantCount?: number;
}

const difficultyConfig = {
  Easy: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
  },
  Medium: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
  },
  Hard: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
  },
};

export function ChallengeCard({ challenge, onStart, participantCount = 0 }: ChallengeCardProps) {
  const config = difficultyConfig[challenge.difficulty];
  const isLocked = !challenge.is_active;

  return (
    <div
      className={`bg-card rounded-xl border border-border p-6 transition-all duration-300 ${
        isLocked ? "opacity-60" : "hover:shadow-soft hover:border-primary/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
              {challenge.difficulty}
            </span>
            {challenge.completed && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            )}
            {challenge.started && !challenge.completed && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Play className="w-3 h-3" />
                In Progress
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">{challenge.title}</h3>
        </div>
        {isLocked ? (
          <Lock className="w-6 h-6 text-muted-foreground flex-shrink-0" />
        ) : challenge.completed ? (
          <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
        ) : (
          <Trophy className="w-6 h-6 text-primary flex-shrink-0" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{challenge.description}</p>

      {/* Custom Progress Bar */}
      {challenge.started && !challenge.completed && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Your Progress</span>
            <span className="text-xs font-bold text-primary">{challenge.progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out relative"
              style={{
                width: `${challenge.progress}%`,
                background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)`,
              }}
            >
              {challenge.progress > 10 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Progress Bar */}
      {challenge.completed && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-success flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Completed!
            </span>
            <span className="text-xs font-bold text-success">100%</span>
          </div>
          <div className="h-3 bg-success/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-success w-full"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Reward:</span>
            <span className="text-sm font-semibold text-primary">{challenge.reward_xp} XP</span>
          </div>
          {challenge.badge_name && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Badge:</span>
              <span className="text-xs font-medium text-foreground">{challenge.badge_name}</span>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant={challenge.completed ? "outline" : challenge.started ? "secondary" : "default"}
          disabled={isLocked}
          onClick={() => onStart(challenge)}
          className="gap-1.5"
        >
          {challenge.completed ? "View Results" : challenge.started ? "Continue" : "Start Challenge"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
