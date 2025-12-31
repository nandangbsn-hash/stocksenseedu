import { Trophy, Clock, Users, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  participants: number;
  daysLeft: number;
  progress: number;
  completed: boolean;
  locked: boolean;
  reward: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onStart: (challenge: Challenge) => void;
}

const difficultyColors = {
  Easy: "bg-success/10 text-success",
  Medium: "bg-warning/10 text-warning-foreground",
  Hard: "bg-destructive/10 text-destructive",
};

export function ChallengeCard({ challenge, onStart }: ChallengeCardProps) {
  return (
    <div
      className={`bg-card rounded-xl border border-border p-6 transition-all duration-300 ${
        challenge.locked ? "opacity-60" : "hover:shadow-soft hover:border-primary/30"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
            {challenge.completed && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">{challenge.title}</h3>
        </div>
        {challenge.locked ? (
          <Lock className="w-6 h-6 text-muted-foreground" />
        ) : (
          <Trophy className="w-6 h-6 text-primary" />
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>

      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {challenge.daysLeft} days left
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {challenge.participants.toLocaleString()} participants
        </div>
      </div>

      {challenge.progress > 0 && !challenge.completed && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium text-primary">{challenge.progress}%</span>
          </div>
          <Progress value={challenge.progress} className="h-2" />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Reward:</span>
          <span className="text-sm font-medium text-primary">{challenge.reward}</span>
        </div>
        <Button
          size="sm"
          variant={challenge.completed ? "outline" : "default"}
          disabled={challenge.locked}
          onClick={() => onStart(challenge)}
        >
          {challenge.completed ? "View Results" : "Start Challenge"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
