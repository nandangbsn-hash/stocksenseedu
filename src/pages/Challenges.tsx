import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChallengeCard, Challenge } from "@/components/ChallengeCard";
import { BadgeCard, Badge } from "@/components/BadgeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Target, Shield, Clock, Layers, TrendingUp, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const challenges: Challenge[] = [
  {
    id: "1",
    title: "Build a Low-Risk Portfolio",
    description: "Create a diversified portfolio with at least 5 different stocks, keeping your risk meter below 40%.",
    difficulty: "Easy",
    participants: 2847,
    daysLeft: 5,
    progress: 60,
    completed: false,
    locked: false,
    reward: "Diversification Pro Badge",
  },
  {
    id: "2",
    title: "Beat Inflation",
    description: "Grow your portfolio by at least 7% to beat the average inflation rate. Learn why this matters.",
    difficulty: "Medium",
    participants: 1923,
    daysLeft: 12,
    progress: 25,
    completed: false,
    locked: false,
    reward: "Inflation Fighter Badge",
  },
  {
    id: "3",
    title: "Survive a Market Crash",
    description: "Experience a simulated 20% market crash and maintain your portfolio without panic selling.",
    difficulty: "Hard",
    participants: 856,
    daysLeft: 8,
    progress: 0,
    completed: false,
    locked: false,
    reward: "Diamond Hands Badge",
  },
  {
    id: "4",
    title: "Sector Explorer",
    description: "Invest in at least one stock from 5 different sectors to understand market diversity.",
    difficulty: "Easy",
    participants: 3421,
    daysLeft: 14,
    progress: 0,
    completed: true,
    locked: false,
    reward: "Sector Expert Badge",
  },
  {
    id: "5",
    title: "Long-Term Thinker",
    description: "Hold your investments for 30 simulated days without selling. Patience is key!",
    difficulty: "Medium",
    participants: 1247,
    daysLeft: 30,
    progress: 0,
    completed: false,
    locked: true,
    reward: "Patient Investor Badge",
  },
];

const badges: Badge[] = [
  {
    id: "1",
    name: "First Investment",
    description: "Made your first stock purchase",
    icon: Zap,
    earned: true,
    earnedDate: "Dec 28, 2024",
    color: "gradient-hero",
  },
  {
    id: "2",
    name: "Diversification Pro",
    description: "Invested in 5+ different stocks",
    icon: Layers,
    earned: true,
    earnedDate: "Dec 29, 2024",
    color: "gradient-success",
  },
  {
    id: "3",
    name: "Long-Term Thinker",
    description: "Held investments for 30+ days",
    icon: Clock,
    earned: false,
    color: "gradient-accent",
  },
  {
    id: "4",
    name: "Risk Manager",
    description: "Kept portfolio risk below 30%",
    icon: Shield,
    earned: false,
    color: "gradient-hero",
  },
  {
    id: "5",
    name: "Sector Expert",
    description: "Invested across 5+ sectors",
    icon: Target,
    earned: true,
    earnedDate: "Dec 30, 2024",
    color: "gradient-success",
  },
  {
    id: "6",
    name: "Inflation Fighter",
    description: "Beat the inflation rate",
    icon: TrendingUp,
    earned: false,
    color: "gradient-accent",
  },
];

export default function Challenges() {
  const [activeChallenges] = useState(challenges);
  const [earnedBadges] = useState(badges);

  const handleStartChallenge = (challenge: Challenge) => {
    toast({
      title: challenge.completed ? "Viewing Results" : "Challenge Started!",
      description: challenge.completed
        ? `Review your performance in "${challenge.title}"`
        : `Good luck with "${challenge.title}"! Remember, it's about learning.`,
    });
  };

  const earnedCount = earnedBadges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              Weekly Challenges
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Learn by Doing
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Complete challenges to earn badges and build real investing skills. No leaderboards — just your personal growth.
            </p>
          </div>

          <Tabs defaultValue="challenges" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Badges ({earnedCount}/{badges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="challenges">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeChallenges.map((challenge, index) => (
                  <div
                    key={challenge.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ChallengeCard challenge={challenge} onStart={handleStartChallenge} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="badges">
              <div className="mb-8">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display font-bold text-foreground">Your Badges</h3>
                      <p className="text-sm text-muted-foreground">
                        Collect badges by completing challenges and learning
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{earnedCount}</p>
                      <p className="text-xs text-muted-foreground">of {badges.length} earned</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {earnedBadges.map((badge, index) => (
                  <div
                    key={badge.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <BadgeCard badge={badge} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Educational Note */}
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
              <h3 className="font-display font-bold text-foreground mb-2">
                🎯 Focus on Learning, Not Winning
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Unlike other platforms, we don't have competitive leaderboards. Our challenges are designed to help you learn and build good habits, not to encourage risky behavior or gambling mentality.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
