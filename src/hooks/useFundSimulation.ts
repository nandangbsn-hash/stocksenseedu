import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MutualFund {
  id: string;
  name: string;
  symbol: string;
  category: 'large_cap' | 'mid_cap' | 'small_cap';
  amc: string;
  nav: number;
  base_nav: number;
  expense_ratio: number;
  risk_level: string;
  one_year_return: number;
  three_year_return: number;
  five_year_return: number;
  aum: string | null;
  description: string | null;
  change: number;
  changePercent: number;
}

export interface IndexFund {
  id: string;
  name: string;
  symbol: string;
  tracking_index: string;
  amc: string;
  nav: number;
  base_nav: number;
  expense_ratio: number;
  tracking_error: number;
  one_year_return: number;
  three_year_return: number;
  five_year_return: number;
  aum: string | null;
  description: string | null;
  change: number;
  changePercent: number;
}

export interface MutualFundHolding {
  id: string;
  mutual_fund_id: string;
  units: number;
  average_nav: number;
  fund: MutualFund;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface IndexFundHolding {
  id: string;
  index_fund_id: string;
  units: number;
  average_nav: number;
  fund: IndexFund;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

const LIVE_UPDATE_INTERVAL = 15 * 1000; // Update every 15 seconds
const YEAR_DURATION = 24 * 60 * 60 * 1000; // 1 real day = 1 simulated year

// Volatility based on fund type
const FUND_VOLATILITY = {
  large_cap: { min: -0.12, max: 0.20 },
  mid_cap: { min: -0.20, max: 0.35 },
  small_cap: { min: -0.30, max: 0.50 },
  index: { min: -0.15, max: 0.25 },
};

export function useFundSimulation(portfolioId: string | null, simulatedYear: number) {
  const { user } = useAuth();
  const [mutualFunds, setMutualFunds] = useState<MutualFund[]>([]);
  const [indexFunds, setIndexFunds] = useState<IndexFund[]>([]);
  const [mfHoldings, setMfHoldings] = useState<MutualFundHolding[]>([]);
  const [ifHoldings, setIfHoldings] = useState<IndexFundHolding[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navCacheRef = useRef<Map<string, number>>(new Map());

  // Apply NAV changes based on volatility
  const applyNAVChange = useCallback((baseNav: number, category: string, yearsPassed: number) => {
    const volatility = FUND_VOLATILITY[category as keyof typeof FUND_VOLATILITY] || FUND_VOLATILITY.large_cap;
    
    let nav = baseNav;
    for (let i = 0; i < yearsPassed; i++) {
      const marketTrend = 0.02 + (Math.random() - 0.4) * 0.1;
      const randomChange = volatility.min + Math.random() * (volatility.max - volatility.min);
      const totalChange = 1 + randomChange + marketTrend;
      nav = nav * Math.max(0.3, totalChange);
    }
    
    return Math.round(nav * 100) / 100;
  }, []);

  // Fetch mutual funds
  const fetchMutualFunds = useCallback(async () => {
    const { data, error } = await supabase
      .from('mutual_funds')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching mutual funds:', error);
      return;
    }

    const simulatedFunds = data.map(fund => {
      const cacheKey = `mf-${fund.id}-${simulatedYear}`;
      let newNav: number;
      
      if (navCacheRef.current.has(cacheKey)) {
        newNav = navCacheRef.current.get(cacheKey)!;
      } else {
        newNav = applyNAVChange(Number(fund.base_nav), fund.category, simulatedYear - 1);
        navCacheRef.current.set(cacheKey, newNav);
      }
      
      // Add small intra-day fluctuation
      const intraDayChange = 1 + (Math.random() - 0.5) * 0.01;
      newNav = newNav * intraDayChange;
      
      const change = newNav - Number(fund.base_nav);
      const changePercent = (change / Number(fund.base_nav)) * 100;

      return {
        ...fund,
        nav: Math.round(newNav * 100) / 100,
        base_nav: Number(fund.base_nav),
        expense_ratio: Number(fund.expense_ratio),
        one_year_return: Number(fund.one_year_return),
        three_year_return: Number(fund.three_year_return),
        five_year_return: Number(fund.five_year_return),
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      } as MutualFund;
    });

    setMutualFunds(simulatedFunds);
    return simulatedFunds;
  }, [simulatedYear, applyNAVChange]);

  // Fetch index funds
  const fetchIndexFunds = useCallback(async () => {
    const { data, error } = await supabase
      .from('index_funds')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching index funds:', error);
      return;
    }

    const simulatedFunds = data.map(fund => {
      const cacheKey = `if-${fund.id}-${simulatedYear}`;
      let newNav: number;
      
      if (navCacheRef.current.has(cacheKey)) {
        newNav = navCacheRef.current.get(cacheKey)!;
      } else {
        newNav = applyNAVChange(Number(fund.base_nav), 'index', simulatedYear - 1);
        navCacheRef.current.set(cacheKey, newNav);
      }
      
      // Add small intra-day fluctuation
      const intraDayChange = 1 + (Math.random() - 0.5) * 0.008;
      newNav = newNav * intraDayChange;
      
      const change = newNav - Number(fund.base_nav);
      const changePercent = (change / Number(fund.base_nav)) * 100;

      return {
        ...fund,
        nav: Math.round(newNav * 100) / 100,
        base_nav: Number(fund.base_nav),
        expense_ratio: Number(fund.expense_ratio),
        tracking_error: Number(fund.tracking_error),
        one_year_return: Number(fund.one_year_return),
        three_year_return: Number(fund.three_year_return),
        five_year_return: Number(fund.five_year_return),
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      } as IndexFund;
    });

    setIndexFunds(simulatedFunds);
    return simulatedFunds;
  }, [simulatedYear, applyNAVChange]);

  // Fetch mutual fund holdings
  const fetchMfHoldings = useCallback(async () => {
    if (!portfolioId) return;

    const { data, error } = await supabase
      .from('mutual_fund_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) {
      console.error('Error fetching MF holdings:', error);
      return;
    }

    const holdingsWithCalcs = data?.map(h => {
      const fund = mutualFunds.find(f => f.id === h.mutual_fund_id);
      if (!fund) return null;

      const units = Number(h.units);
      const avgNav = Number(h.average_nav);
      const currentValue = fund.nav * units;
      const investedValue = avgNav * units;
      const profitLoss = currentValue - investedValue;
      const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      return {
        id: h.id,
        mutual_fund_id: h.mutual_fund_id,
        units,
        average_nav: avgNav,
        fund,
        currentValue,
        profitLoss,
        profitLossPercent,
      } as MutualFundHolding;
    }).filter(Boolean) as MutualFundHolding[];

    setMfHoldings(holdingsWithCalcs || []);
  }, [portfolioId, mutualFunds]);

  // Fetch index fund holdings
  const fetchIfHoldings = useCallback(async () => {
    if (!portfolioId) return;

    const { data, error } = await supabase
      .from('index_fund_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) {
      console.error('Error fetching IF holdings:', error);
      return;
    }

    const holdingsWithCalcs = data?.map(h => {
      const fund = indexFunds.find(f => f.id === h.index_fund_id);
      if (!fund) return null;

      const units = Number(h.units);
      const avgNav = Number(h.average_nav);
      const currentValue = fund.nav * units;
      const investedValue = avgNav * units;
      const profitLoss = currentValue - investedValue;
      const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      return {
        id: h.id,
        index_fund_id: h.index_fund_id,
        units,
        average_nav: avgNav,
        fund,
        currentValue,
        profitLoss,
        profitLossPercent,
      } as IndexFundHolding;
    }).filter(Boolean) as IndexFundHolding[];

    setIfHoldings(holdingsWithCalcs || []);
  }, [portfolioId, indexFunds]);

  // Buy mutual fund
  const buyMutualFund = async (fundId: string, amount: number, currentCashBalance: number) => {
    if (!user || !portfolioId) throw new Error('Not authenticated');

    const fund = mutualFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');

    if (amount > currentCashBalance) {
      throw new Error('Insufficient balance');
    }

    const unitsToBuy = amount / fund.nav;

    // Check for existing holding
    const { data: existingHolding, error: holdingError } = await supabase
      .from('mutual_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolioId)
      .eq('mutual_fund_id', fundId)
      .maybeSingle();

    if (holdingError) throw holdingError;

    // Update cash balance
    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: currentCashBalance - amount })
      .eq('id', portfolioId);

    if (balanceError) throw balanceError;

    if (existingHolding) {
      const currentUnits = Number(existingHolding.units);
      const currentAvgNav = Number(existingHolding.average_nav);
      const totalUnits = currentUnits + unitsToBuy;
      const totalInvested = (currentAvgNav * currentUnits) + amount;
      const newAvgNav = totalInvested / totalUnits;

      const { error } = await supabase
        .from('mutual_fund_holdings')
        .update({
          units: totalUnits,
          average_nav: newAvgNav,
        })
        .eq('id', existingHolding.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('mutual_fund_holdings')
        .insert({
          portfolio_id: portfolioId,
          mutual_fund_id: fundId,
          units: unitsToBuy,
          average_nav: fund.nav,
        });

      if (error) throw error;
    }

    await fetchMfHoldings();
    return { success: true, units: unitsToBuy };
  };

  // Sell mutual fund
  const sellMutualFund = async (fundId: string, units: number, currentCashBalance: number) => {
    if (!user || !portfolioId) throw new Error('Not authenticated');

    const { data: holding, error: holdingError } = await supabase
      .from('mutual_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolioId)
      .eq('mutual_fund_id', fundId)
      .maybeSingle();

    if (holdingError) throw holdingError;
    if (!holding || Number(holding.units) < units) {
      throw new Error('Insufficient units');
    }

    const fund = mutualFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');

    const totalProceeds = fund.nav * units;

    // Update cash balance
    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: currentCashBalance + totalProceeds })
      .eq('id', portfolioId);

    if (balanceError) throw balanceError;

    if (Number(holding.units) === units) {
      await supabase.from('mutual_fund_holdings').delete().eq('id', holding.id);
    } else {
      await supabase
        .from('mutual_fund_holdings')
        .update({ units: Number(holding.units) - units })
        .eq('id', holding.id);
    }

    await fetchMfHoldings();
    return { success: true };
  };

  // Buy index fund
  const buyIndexFund = async (fundId: string, amount: number, currentCashBalance: number) => {
    if (!user || !portfolioId) throw new Error('Not authenticated');

    const fund = indexFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');

    if (amount > currentCashBalance) {
      throw new Error('Insufficient balance');
    }

    const unitsToBuy = amount / fund.nav;

    const { data: existingHolding, error: holdingError } = await supabase
      .from('index_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolioId)
      .eq('index_fund_id', fundId)
      .maybeSingle();

    if (holdingError) throw holdingError;

    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: currentCashBalance - amount })
      .eq('id', portfolioId);

    if (balanceError) throw balanceError;

    if (existingHolding) {
      const currentUnits = Number(existingHolding.units);
      const currentAvgNav = Number(existingHolding.average_nav);
      const totalUnits = currentUnits + unitsToBuy;
      const totalInvested = (currentAvgNav * currentUnits) + amount;
      const newAvgNav = totalInvested / totalUnits;

      const { error } = await supabase
        .from('index_fund_holdings')
        .update({
          units: totalUnits,
          average_nav: newAvgNav,
        })
        .eq('id', existingHolding.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('index_fund_holdings')
        .insert({
          portfolio_id: portfolioId,
          index_fund_id: fundId,
          units: unitsToBuy,
          average_nav: fund.nav,
        });

      if (error) throw error;
    }

    await fetchIfHoldings();
    return { success: true, units: unitsToBuy };
  };

  // Sell index fund
  const sellIndexFund = async (fundId: string, units: number, currentCashBalance: number) => {
    if (!user || !portfolioId) throw new Error('Not authenticated');

    const { data: holding, error: holdingError } = await supabase
      .from('index_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolioId)
      .eq('index_fund_id', fundId)
      .maybeSingle();

    if (holdingError) throw holdingError;
    if (!holding || Number(holding.units) < units) {
      throw new Error('Insufficient units');
    }

    const fund = indexFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');

    const totalProceeds = fund.nav * units;

    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: currentCashBalance + totalProceeds })
      .eq('id', portfolioId);

    if (balanceError) throw balanceError;

    if (Number(holding.units) === units) {
      await supabase.from('index_fund_holdings').delete().eq('id', holding.id);
    } else {
      await supabase
        .from('index_fund_holdings')
        .update({ units: Number(holding.units) - units })
        .eq('id', holding.id);
    }

    await fetchIfHoldings();
    return { success: true };
  };

  // Calculate metrics
  const mfMetrics = {
    totalValue: mfHoldings.reduce((sum, h) => sum + h.currentValue, 0),
    investedValue: mfHoldings.reduce((sum, h) => sum + (h.average_nav * h.units), 0),
    unrealizedPL: mfHoldings.reduce((sum, h) => sum + h.profitLoss, 0),
  };

  const ifMetrics = {
    totalValue: ifHoldings.reduce((sum, h) => sum + h.currentValue, 0),
    investedValue: ifHoldings.reduce((sum, h) => sum + (h.average_nav * h.units), 0),
    unrealizedPL: ifHoldings.reduce((sum, h) => sum + h.profitLoss, 0),
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchMutualFunds(), fetchIndexFunds()]);
      setLoading(false);
    };
    init();
  }, [fetchMutualFunds, fetchIndexFunds]);

  // Fetch holdings when funds are loaded
  useEffect(() => {
    if (portfolioId && mutualFunds.length > 0) {
      fetchMfHoldings();
    }
  }, [portfolioId, mutualFunds, fetchMfHoldings]);

  useEffect(() => {
    if (portfolioId && indexFunds.length > 0) {
      fetchIfHoldings();
    }
  }, [portfolioId, indexFunds, fetchIfHoldings]);

  // Live NAV updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMutualFunds(prev => prev.map(fund => {
        const fluctuation = 1 + (Math.random() - 0.5) * 0.01;
        const newNav = fund.nav * fluctuation;
        const change = newNav - fund.base_nav;
        const changePercent = (change / fund.base_nav) * 100;
        
        return {
          ...fund,
          nav: Math.round(newNav * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        };
      }));

      setIndexFunds(prev => prev.map(fund => {
        const fluctuation = 1 + (Math.random() - 0.5) * 0.008;
        const newNav = fund.nav * fluctuation;
        const change = newNav - fund.base_nav;
        const changePercent = (change / fund.base_nav) * 100;
        
        return {
          ...fund,
          nav: Math.round(newNav * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        };
      }));
    }, LIVE_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  return {
    mutualFunds,
    indexFunds,
    mfHoldings,
    ifHoldings,
    mfMetrics,
    ifMetrics,
    loading,
    buyMutualFund,
    sellMutualFund,
    buyIndexFund,
    sellIndexFund,
    refreshData: () => {
      fetchMutualFunds();
      fetchIndexFunds();
      fetchMfHoldings();
      fetchIfHoldings();
    },
  };
}
