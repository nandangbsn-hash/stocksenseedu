import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  reward_xp: number;
  badge_name: string | null;
  is_active: boolean;
  // User-specific progress
  progress: number;
  completed: boolean;
  started: boolean;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: string | null;
  earned: boolean;
  earned_at: string | null;
}

export function useChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    try {
      // Fetch all active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (challengesError) throw challengesError;

      if (!user) {
        // Not logged in - show challenges without progress
        setChallenges(
          (challengesData || []).map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            difficulty: c.difficulty as "Easy" | "Medium" | "Hard",
            reward_xp: c.reward_xp || 100,
            badge_name: c.badge_name,
            is_active: c.is_active ?? true,
            progress: 0,
            completed: false,
            started: false,
          }))
        );
        setLoading(false);
        return;
      }

      // Fetch user's progress for all challenges
      const { data: progressData, error: progressError } = await supabase
        .from("challenge_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      // Map progress to challenges
      const progressMap = new Map(
        (progressData || []).map((p) => [p.challenge_id, p])
      );

      const mappedChallenges: Challenge[] = (challengesData || []).map((c) => {
        const userProgress = progressMap.get(c.id);
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          difficulty: c.difficulty as "Easy" | "Medium" | "Hard",
          reward_xp: c.reward_xp || 100,
          badge_name: c.badge_name,
          is_active: c.is_active ?? true,
          progress: userProgress?.progress || 0,
          completed: userProgress?.completed || false,
          started: !!userProgress,
        };
      });

      setChallenges(mappedChallenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      // Fetch all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*")
        .order("created_at", { ascending: true });

      if (badgesError) throw badgesError;

      if (!user) {
        setBadges(
          (badgesData || []).map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            icon_name: b.icon_name,
            category: b.category,
            earned: false,
            earned_at: null,
          }))
        );
        return;
      }

      // Fetch user's earned badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      if (userBadgesError) throw userBadgesError;

      const earnedMap = new Map(
        (userBadgesData || []).map((ub) => [ub.badge_id, ub.earned_at])
      );

      setBadges(
        (badgesData || []).map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon_name: b.icon_name,
          category: b.category,
          earned: earnedMap.has(b.id),
          earned_at: earnedMap.get(b.id) || null,
        }))
      );
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const startChallenge = async (challengeId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to start challenges",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("challenge_progress").insert({
        challenge_id: challengeId,
        user_id: user.id,
        progress: 0,
        completed: false,
      });

      if (error) {
        if (error.code === "23505") {
          // Already started
          toast({
            title: "Already Started",
            description: "You've already started this challenge!",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Challenge Started! 🚀",
        description: "Good luck! Complete the objectives to earn rewards.",
      });

      // Refresh challenges
      fetchChallenges();
    } catch (error) {
      console.error("Error starting challenge:", error);
      toast({
        title: "Error",
        description: "Failed to start challenge",
        variant: "destructive",
      });
    }
  };

  const updateProgress = async (challengeId: string, newProgress: number) => {
    if (!user) return;

    try {
      const completed = newProgress >= 100;
      const updateData: {
        progress: number;
        completed: boolean;
        completed_at?: string;
      } = {
        progress: Math.min(newProgress, 100),
        completed,
      };

      if (completed) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("challenge_progress")
        .update(updateData)
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id);

      if (error) throw error;

      if (completed) {
        toast({
          title: "Challenge Completed! 🎉",
          description: "Congratulations! You've earned XP and possibly a badge!",
        });
      }

      fetchChallenges();
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchBadges();
  }, [user]);

  return {
    challenges,
    badges,
    loading,
    startChallenge,
    updateProgress,
    refetch: fetchChallenges,
    refetchBadges: fetchBadges,
  };
}
