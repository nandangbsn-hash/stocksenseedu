import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// Challenge IDs mapped to their titles for reference
const CHALLENGE_TITLES = {
  FIRST_TRADE: "First Trade",
  PORTFOLIO_BUILDER: "Portfolio Builder",
  SECTOR_SPECIALIST: "Sector Specialist",
  BUILD_BALANCED: "Build a Balanced Portfolio",
  INDEX_INVESTOR: "Index Investor",
  MUTUAL_FUND_EXPLORER: "Mutual Fund Explorer",
  BEAT_INFLATION: "Beat Inflation",
  MARKET_TIMER: "Market Timer",
  COMPLETE_BASICS: "Complete Basics",
  DIVIDEND_LEARNER: "Dividend Learner",
} as const;

interface TrackingData {
  stocksBought?: number;
  sectorsInvested?: string[];
  portfolioValue?: number;
  indexFundsOwned?: number;
  mutualFundCategories?: string[];
  portfolioReturn?: number;
  yearsHeld?: number;
  lessonsCompleted?: string[];
}

export function useChallengeTracker() {
  const { user } = useAuth();

  // Auto-start a challenge if not already started
  const ensureChallengeStarted = useCallback(async (challengeId: string) => {
    if (!user) return false;

    try {
      // Check if already started
      const { data: existing } = await supabase
        .from("challenge_progress")
        .select("id")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) return true;

      // Auto-start the challenge
      const { error } = await supabase.from("challenge_progress").insert({
        challenge_id: challengeId,
        user_id: user.id,
        progress: 0,
        completed: false,
      });

      return !error;
    } catch {
      return false;
    }
  }, [user]);

  // Award a badge to the user
  async function awardBadge(badgeName: string) {
    if (!user) return;

    try {
      // Find badge by name
      const { data: badge } = await supabase
        .from("badges")
        .select("id")
        .eq("name", badgeName)
        .maybeSingle();

      if (!badge) return;

      // Check if already earned
      const { data: existing } = await supabase
        .from("user_badges")
        .select("id")
        .eq("badge_id", badge.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) return;

      // Award the badge
      await supabase.from("user_badges").insert({
        badge_id: badge.id,
        user_id: user.id,
      });
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  }

  // Update progress for a specific challenge
  const updateChallengeProgress = useCallback(async (
    challengeId: string,
    progress: number,
    badgeName?: string | null
  ) => {
    if (!user) return;

    try {
      // DB column is INTEGER, so normalize to an int (and keep it within 0..100)
      const normalizedProgress = Number.isFinite(progress)
        ? Math.max(0, Math.min(Math.round(progress), 100))
        : 0;

      const completed = normalizedProgress >= 100;

      const { error } = await supabase
        .from("challenge_progress")
        .upsert(
          {
            challenge_id: challengeId,
            user_id: user.id,
            progress: normalizedProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: "challenge_id,user_id" }
        );

      if (error) throw error;

      // If completed, award badge if applicable
      if (completed && badgeName) {
        await awardBadge(badgeName);
        toast({
          title: "Challenge Completed! 🎉",
          description: `You've earned XP and the "${badgeName}" badge!`,
        });
      } else if (completed) {
        toast({
          title: "Challenge Completed! 🎉",
          description: "Congratulations! You've earned XP!",
        });
      }
    } catch (error) {
      console.error("Error updating challenge progress:", error);
    }
  }, [user]);

  // Track when user buys a stock
  const trackStockPurchase = useCallback(async (
    stockSector: string,
    totalStocksOwned: number,
    uniqueSectors: string[],
    portfolioValue: number
  ) => {
    if (!user) return;

    try {
      // Get all challenges
      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, title, badge_name")
        .eq("is_active", true);

      if (!challenges) return;

      const challengeMap = new Map(challenges.map(c => [c.title, c]));

      // First Trade Challenge - Complete on first purchase
      const firstTrade = challengeMap.get(CHALLENGE_TITLES.FIRST_TRADE);
      if (firstTrade && totalStocksOwned >= 1) {
        await ensureChallengeStarted(firstTrade.id);
        await updateChallengeProgress(firstTrade.id, 100, firstTrade.badge_name);
      }

      // Sector Specialist - Invest in 5 sectors
      const sectorSpecialist = challengeMap.get(CHALLENGE_TITLES.SECTOR_SPECIALIST);
      if (sectorSpecialist) {
        await ensureChallengeStarted(sectorSpecialist.id);
        const progress = Math.min((uniqueSectors.length / 5) * 100, 100);
        await updateChallengeProgress(sectorSpecialist.id, progress, sectorSpecialist.badge_name);
      }

      // Build Balanced Portfolio - 5 different sectors
      const balanced = challengeMap.get(CHALLENGE_TITLES.BUILD_BALANCED);
      if (balanced) {
        await ensureChallengeStarted(balanced.id);
        const progress = Math.min((uniqueSectors.length / 5) * 100, 100);
        await updateChallengeProgress(balanced.id, progress, balanced.badge_name);
      }

      // Portfolio Builder - Reach 150,000 value
      const portfolioBuilder = challengeMap.get(CHALLENGE_TITLES.PORTFOLIO_BUILDER);
      if (portfolioBuilder) {
        await ensureChallengeStarted(portfolioBuilder.id);
        const progress = Math.min((portfolioValue / 150000) * 100, 100);
        await updateChallengeProgress(portfolioBuilder.id, progress, portfolioBuilder.badge_name);
      }
    } catch (error) {
      console.error("Error tracking stock purchase:", error);
    }
  }, [user, ensureChallengeStarted, updateChallengeProgress]);

  // Track when user buys an index fund
  const trackIndexFundPurchase = useCallback(async (totalIndexFundsOwned: number) => {
    if (!user) return;

    try {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("id, badge_name")
        .eq("title", CHALLENGE_TITLES.INDEX_INVESTOR)
        .maybeSingle();

      if (!challenge) return;

      await ensureChallengeStarted(challenge.id);
      const progress = Math.min((totalIndexFundsOwned / 2) * 100, 100);
      await updateChallengeProgress(challenge.id, progress, challenge.badge_name);
    } catch (error) {
      console.error("Error tracking index fund purchase:", error);
    }
  }, [user, ensureChallengeStarted, updateChallengeProgress]);

  // Track when user buys a mutual fund
  const trackMutualFundPurchase = useCallback(async (categories: string[]) => {
    if (!user) return;

    try {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("id, badge_name")
        .eq("title", CHALLENGE_TITLES.MUTUAL_FUND_EXPLORER)
        .maybeSingle();

      if (!challenge) return;

      await ensureChallengeStarted(challenge.id);
      // Need all 3 categories: Large Cap, Mid Cap, Small Cap
      const uniqueCategories = new Set(categories);
      const progress = Math.min((uniqueCategories.size / 3) * 100, 100);
      await updateChallengeProgress(challenge.id, progress, challenge.badge_name);
    } catch (error) {
      console.error("Error tracking mutual fund purchase:", error);
    }
  }, [user, ensureChallengeStarted, updateChallengeProgress]);

  // Track portfolio return for Beat Inflation challenge
  const trackPortfolioReturn = useCallback(async (returnPercent: number) => {
    if (!user) return;

    try {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("id, badge_name")
        .eq("title", CHALLENGE_TITLES.BEAT_INFLATION)
        .maybeSingle();

      if (!challenge) return;

      await ensureChallengeStarted(challenge.id);
      // Need 6% return to beat inflation
      const progress = Math.min((returnPercent / 6) * 100, 100);
      await updateChallengeProgress(challenge.id, progress, challenge.badge_name);
    } catch (error) {
      console.error("Error tracking portfolio return:", error);
    }
  }, [user, ensureChallengeStarted, updateChallengeProgress]);

  // Track years held for Market Timer challenge
  const trackYearsHeld = useCallback(async (years: number) => {
    if (!user) return;

    try {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("id, badge_name")
        .eq("title", CHALLENGE_TITLES.MARKET_TIMER)
        .maybeSingle();

      if (!challenge) return;

      await ensureChallengeStarted(challenge.id);
      // Need 3 years
      const progress = Math.min((years / 3) * 100, 100);
      await updateChallengeProgress(challenge.id, progress, challenge.badge_name);
    } catch (error) {
      console.error("Error tracking years held:", error);
    }
  }, [user, ensureChallengeStarted, updateChallengeProgress]);

  // Track lesson completion
  const trackLessonCompleted = useCallback(async (lessonCategory: string, totalBasicsCompleted: number, totalBasicsCount: number) => {
    if (!user) return;

    try {
      // Complete Basics challenge
      if (lessonCategory === "basics") {
        const { data: challenge } = await supabase
          .from("challenges")
          .select("id, badge_name")
          .eq("title", CHALLENGE_TITLES.COMPLETE_BASICS)
          .maybeSingle();

        if (challenge) {
          await ensureChallengeStarted(challenge.id);
          const progress = Math.min((totalBasicsCompleted / totalBasicsCount) * 100, 100);
          await updateChallengeProgress(challenge.id, progress, challenge.badge_name);
        }
      }
    } catch (error) {
      console.error("Error tracking lesson completion:", error);
    }
  }, [user, ensureChallengeStarted, updateChallengeProgress]);

  return {
    trackStockPurchase,
    trackIndexFundPurchase,
    trackMutualFundPurchase,
    trackPortfolioReturn,
    trackYearsHeld,
    trackLessonCompleted,
    awardBadge,
  };
}
