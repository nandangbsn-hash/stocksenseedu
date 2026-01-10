import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChallengeCard } from "@/components/ChallengeCard";
import { BadgeCard } from "@/components/BadgeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Loader2, LogIn } from "lucide-react";
import { useChallenges, Challenge } from "@/hooks/useChallenges";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function Challenges() {
  const { user } = useAuth();
  const { challenges, badges, loading, startChallenge, refetch, refetchBadges } = useChallenges();

  const handleStartChallenge = (challenge: Challenge) => {
    if (challenge.completed) {
      toast({
        title: "Challenge Completed! 🎉",
        description: `You've already completed "${challenge.title}" and earned ${challenge.reward_xp} XP!`,
      });
      return;
    }

    if (challenge.started) {
      toast({
        title: "Keep Going! 💪",
        description: `Continue working on "${challenge.title}" to earn your rewards.`,
      });
      return;
    }

    startChallenge(challenge.id);
  };

  const refresh = useCallback(() => {
    refetch?.();
    refetchBadges?.();
  }, [refetch, refetchBadges]);

  // Keep this page in-sync when progress/badges update (e.g. after simulator actions)
  useEffect(() => {
    refresh();

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!user) {
      return () => {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    const channel = supabase
      .channel("challenges-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenge_progress",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const earnedCount = badges.filter((b) => b.earned).length;
  const completedChallenges = challenges.filter((c) => c.completed).length;
  const inProgressChallenges = challenges.filter((c) => c.started && !c.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading challenges...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-8">
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

          {/* Stats Summary */}
          {user && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-primary">{completedChallenges}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-secondary">{inProgressChallenges}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{earnedCount}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Badges Earned</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Prompt */}
          {!user && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                <LogIn className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground mb-2">
                  Login to Track Progress
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to start challenges, earn XP, and collect badges!
                </p>
                <Link to="/auth">
                  <Button>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login / Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <Tabs defaultValue="challenges" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Challenges ({challenges.length})
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Badges ({earnedCount}/{badges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="challenges">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.map((challenge, index) => (
                  <div
                    key={challenge.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ChallengeCard challenge={challenge} onStart={handleStartChallenge} />
                  </div>
                ))}
              </div>

              {challenges.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No challenges available yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges">
              <div className="mb-8">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-foreground">Your Badge Collection</h3>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {badges.map((badge, index) => (
                  <div
                    key={badge.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <BadgeCard badge={badge} />
                  </div>
                ))}
              </div>

              {badges.length === 0 && (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No badges available yet.</p>
                </div>
              )}
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
