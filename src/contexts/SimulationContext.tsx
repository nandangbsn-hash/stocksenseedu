import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  industry: string | null;
  base_price: number;
  current_price: number;
  risk_level: string;
  market_cap: string | null;
  description: string | null;
  change: number;
  changePercent: number;
  yearlyPrice: number;
}

export interface Portfolio {
  id: string;
  user_id: string;
  cash_balance: number;
  simulated_year: number;
  year_started_at: string;
}

export interface Holding {
  id: string;
  stock_id: string;
  quantity: number;
  average_buy_price: number;
  stock: Stock;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

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
  yearlyNav: number;
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
  yearlyNav: number;
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

export interface PortfolioHistoryPoint {
  year: number;
  totalValue: number;
  invested: number;
}

export interface SimulationEndData {
  finalYear: number;
  totalValue: number;
  holdings: Holding[];
  portfolioHistory: PortfolioHistoryPoint[];
  cashBalance: number;
}

// Constants
const YEAR_DURATION = 24 * 60 * 60 * 1000;
const MAX_SIMULATION_YEARS = 20;
const LIVE_UPDATE_INTERVAL = 10 * 1000; // 10 seconds for live updates

const ANNUAL_VOLATILITY = {
  High: { min: -0.40, max: 0.60 },
  Medium: { min: -0.25, max: 0.40 },
  Low: { min: -0.12, max: 0.22 },
};

const INTRADAY_FLUCTUATION = {
  High: 0.003,
  Medium: 0.002,
  Low: 0.001,
};

const FUND_VOLATILITY = {
  large_cap: { min: -0.15, max: 0.28 },
  mid_cap: { min: -0.25, max: 0.45 },
  small_cap: { min: -0.35, max: 0.60 },
  index: { min: -0.18, max: 0.30 },
};

const FUND_INTRADAY = {
  large_cap: 0.001,
  mid_cap: 0.0015,
  small_cap: 0.002,
  index: 0.0008,
};

// Seeded random for consistent returns
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface SimulationContextType {
  // State
  stocks: Stock[];
  portfolio: Portfolio | null;
  holdings: Holding[];
  mutualFunds: MutualFund[];
  indexFunds: IndexFund[];
  mfHoldings: MutualFundHolding[];
  ifHoldings: IndexFundHolding[];
  simulatedYear: number;
  portfolioHistory: PortfolioHistoryPoint[];
  loading: boolean;
  simulationEnded: boolean;
  endData: SimulationEndData | null;
  maxYears: number;
  
  // Metrics
  metrics: {
    totalValue: number;
    investedValue: number;
    cashBalance: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    riskScore: number;
  };
  mfMetrics: { totalValue: number; investedValue: number; unrealizedPL: number };
  ifMetrics: { totalValue: number; investedValue: number; unrealizedPL: number };
  
  // Actions
  buyStock: (stockId: string, quantity: number) => Promise<{ success: boolean }>;
  sellStock: (stockId: string, quantity: number) => Promise<{ success: boolean }>;
  buyMutualFund: (fundId: string, amount: number) => Promise<{ success: boolean; units: number }>;
  sellMutualFund: (fundId: string, units: number) => Promise<{ success: boolean }>;
  buyIndexFund: (fundId: string, amount: number) => Promise<{ success: boolean; units: number }>;
  sellIndexFund: (fundId: string, units: number) => Promise<{ success: boolean }>;
  resetSimulation: () => Promise<void>;
  refreshData: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Stock state
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [simulatedYear, setSimulatedYear] = useState(1);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [endData, setEndData] = useState<SimulationEndData | null>(null);
  
  // Fund state
  const [mutualFunds, setMutualFunds] = useState<MutualFund[]>([]);
  const [indexFunds, setIndexFunds] = useState<IndexFund[]>([]);
  const [mfHoldings, setMfHoldings] = useState<MutualFundHolding[]>([]);
  const [ifHoldings, setIfHoldings] = useState<IndexFundHolding[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Refs for caching
  const yearlyPricesRef = useRef<Map<string, number>>(new Map());
  const navCacheRef = useRef<Map<string, number>>(new Map());
  const lastYearRef = useRef<number>(1);
  const isInitializedRef = useRef(false);

  // Calculate simulated year
  const calculateSimulatedYear = useCallback((yearStartedAt: string) => {
    const startDate = new Date(yearStartedAt);
    const now = new Date();
    const elapsed = now.getTime() - startDate.getTime();
    const yearsElapsed = Math.floor(elapsed / YEAR_DURATION);
    return Math.min(1 + yearsElapsed, MAX_SIMULATION_YEARS);
  }, []);

  // Calculate yearly stock price
  const calculateYearlyPrice = useCallback((stockId: string, basePrice: number, riskLevel: string, year: number): number => {
    const cacheKey = `${stockId}-${year}`;
    if (yearlyPricesRef.current.has(cacheKey)) {
      return yearlyPricesRef.current.get(cacheKey)!;
    }
    
    const volatility = ANNUAL_VOLATILITY[riskLevel as keyof typeof ANNUAL_VOLATILITY] || ANNUAL_VOLATILITY.Medium;
    
    let price = basePrice;
    for (let y = 1; y < year; y++) {
      const seed = parseInt(stockId.replace(/-/g, '').slice(0, 8), 16) + y;
      const rand = seededRandom(seed);
      const marketBias = 0.06;
      const annualReturn = volatility.min + rand * (volatility.max - volatility.min) + marketBias * (rand > 0.3 ? 1 : -0.5);
      price = price * (1 + annualReturn);
      price = Math.max(price, basePrice * 0.1);
    }
    
    const finalPrice = Math.round(price * 100) / 100;
    yearlyPricesRef.current.set(cacheKey, finalPrice);
    return finalPrice;
  }, []);

  // Calculate yearly NAV for funds
  const calculateYearlyNav = useCallback((fundId: string, baseNav: number, category: string, year: number): number => {
    const cacheKey = `${fundId}-${year}`;
    if (navCacheRef.current.has(cacheKey)) {
      return navCacheRef.current.get(cacheKey)!;
    }
    
    const volatility = FUND_VOLATILITY[category as keyof typeof FUND_VOLATILITY] || FUND_VOLATILITY.large_cap;
    
    let nav = baseNav;
    for (let y = 1; y < year; y++) {
      const seed = parseInt(fundId.replace(/-/g, '').slice(0, 8), 16) + y;
      const rand = seededRandom(seed);
      const marketBias = 0.08;
      const annualReturn = volatility.min + rand * (volatility.max - volatility.min) + marketBias * (rand > 0.25 ? 1 : -0.5);
      nav = nav * (1 + annualReturn);
      nav = Math.max(nav, baseNav * 0.2);
    }
    
    const finalNav = Math.round(nav * 100) / 100;
    navCacheRef.current.set(cacheKey, finalNav);
    return finalNav;
  }, []);

  // Fetch stocks
  const fetchStocks = useCallback(async (year?: number) => {
    const { data, error } = await supabase.from('stocks').select('*').order('symbol');
    if (error) {
      console.error('Error fetching stocks:', error);
      return;
    }

    const targetYear = year || simulatedYear;
    const simulatedStocks = data.map(stock => {
      const yearlyPrice = calculateYearlyPrice(stock.id, Number(stock.base_price), stock.risk_level || 'Medium', targetYear);
      const change = yearlyPrice - Number(stock.base_price);
      const changePercent = (change / Number(stock.base_price)) * 100;

      return {
        ...stock,
        base_price: Number(stock.base_price),
        current_price: yearlyPrice,
        yearlyPrice,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      } as Stock;
    });

    setStocks(simulatedStocks);
    return simulatedStocks;
  }, [simulatedYear, calculateYearlyPrice]);

  // Fetch mutual funds
  const fetchMutualFunds = useCallback(async (year?: number) => {
    const { data, error } = await supabase.from('mutual_funds').select('*').order('category');
    if (error) return;

    const targetYear = year || simulatedYear;
    const funds = data.map(fund => {
      const yearlyNav = calculateYearlyNav(fund.id, Number(fund.base_nav), fund.category, targetYear);
      const change = yearlyNav - Number(fund.base_nav);
      const changePercent = (change / Number(fund.base_nav)) * 100;

      return {
        ...fund,
        nav: yearlyNav,
        yearlyNav,
        base_nav: Number(fund.base_nav),
        expense_ratio: Number(fund.expense_ratio),
        one_year_return: Number(fund.one_year_return),
        three_year_return: Number(fund.three_year_return),
        five_year_return: Number(fund.five_year_return),
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      } as MutualFund;
    });

    setMutualFunds(funds);
    return funds;
  }, [simulatedYear, calculateYearlyNav]);

  // Fetch index funds
  const fetchIndexFunds = useCallback(async (year?: number) => {
    const { data, error } = await supabase.from('index_funds').select('*').order('name');
    if (error) return;

    const targetYear = year || simulatedYear;
    const funds = data.map(fund => {
      const yearlyNav = calculateYearlyNav(fund.id, Number(fund.base_nav), 'index', targetYear);
      const change = yearlyNav - Number(fund.base_nav);
      const changePercent = (change / Number(fund.base_nav)) * 100;

      return {
        ...fund,
        nav: yearlyNav,
        yearlyNav,
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

    setIndexFunds(funds);
    return funds;
  }, [simulatedYear, calculateYearlyNav]);

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching portfolio:', error);
      return;
    }

    if (data) {
      const currentYear = calculateSimulatedYear(data.year_started_at);
      
      if (currentYear > data.simulated_year) {
        await supabase
          .from('portfolios')
          .update({ simulated_year: currentYear })
          .eq('id', data.id);
      }
      
      lastYearRef.current = currentYear;
      setSimulatedYear(currentYear);
      setPortfolio({
        ...data,
        cash_balance: Number(data.cash_balance),
        simulated_year: currentYear,
      });
      
      return { ...data, cash_balance: Number(data.cash_balance), simulated_year: currentYear };
    }
  }, [user, calculateSimulatedYear]);

  // Fetch stock holdings
  const fetchHoldings = useCallback(async (currentStocks?: Stock[]) => {
    if (!user || !portfolio) return;

    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);

    if (error) {
      console.error('Error fetching holdings:', error);
      return;
    }

    const stockList = currentStocks || stocks;
    const holdingsWithCalcs = data?.map(h => {
      const stock = stockList.find(s => s.id === h.stock_id);
      if (!stock) return null;

      const currentValue = stock.current_price * h.quantity;
      const investedValue = Number(h.average_buy_price) * h.quantity;
      const profitLoss = currentValue - investedValue;
      const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      return {
        ...h,
        average_buy_price: Number(h.average_buy_price),
        stock,
        currentValue,
        profitLoss,
        profitLossPercent,
      };
    }).filter(Boolean) as Holding[];

    setHoldings(holdingsWithCalcs || []);
    return holdingsWithCalcs;
  }, [user, portfolio, stocks]);

  // Fetch MF holdings
  const fetchMfHoldings = useCallback(async (funds?: MutualFund[]) => {
    if (!portfolio) return;

    const { data, error } = await supabase
      .from('mutual_fund_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);

    if (error) return;

    const fundList = funds || mutualFunds;
    const holdingsWithCalcs = data?.map(h => {
      const fund = fundList.find(f => f.id === h.mutual_fund_id);
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
  }, [portfolio, mutualFunds]);

  // Fetch IF holdings
  const fetchIfHoldings = useCallback(async (funds?: IndexFund[]) => {
    if (!portfolio) return;

    const { data, error } = await supabase
      .from('index_fund_holdings')
      .select('*')
      .eq('portfolio_id', portfolio.id);

    if (error) return;

    const fundList = funds || indexFunds;
    const holdingsWithCalcs = data?.map(h => {
      const fund = fundList.find(f => f.id === h.index_fund_id);
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
  }, [portfolio, indexFunds]);

  // Buy stock
  const buyStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    const totalCost = stock.current_price * quantity;
    if (totalCost > portfolio.cash_balance) throw new Error('Insufficient balance');

    const { data: existingHolding } = await supabase
      .from('holdings')
      .select('id, quantity, average_buy_price')
      .eq('portfolio_id', portfolio.id)
      .eq('stock_id', stockId)
      .maybeSingle();

    const newBalance = portfolio.cash_balance - totalCost;
    await supabase.from('portfolios').update({ cash_balance: newBalance }).eq('id', portfolio.id);

    if (existingHolding) {
      const totalShares = existingHolding.quantity + quantity;
      const totalInvested = (Number(existingHolding.average_buy_price) * existingHolding.quantity) + totalCost;
      const newAvgPrice = totalInvested / totalShares;

      await supabase
        .from('holdings')
        .update({ quantity: totalShares, average_buy_price: newAvgPrice })
        .eq('id', existingHolding.id);
    } else {
      await supabase.from('holdings').insert({
        portfolio_id: portfolio.id,
        stock_id: stockId,
        quantity,
        average_buy_price: stock.current_price,
      });
    }

    await supabase.from('transactions').insert({
      portfolio_id: portfolio.id,
      stock_id: stockId,
      transaction_type: 'BUY',
      quantity,
      price_per_share: stock.current_price,
      total_amount: totalCost,
      simulated_year: simulatedYear,
    });

    setPortfolio(prev => prev ? { ...prev, cash_balance: newBalance } : null);
    await fetchHoldings();

    return { success: true };
  };

  // Sell stock
  const sellStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const { data: holding } = await supabase
      .from('holdings')
      .select('id, quantity, average_buy_price')
      .eq('portfolio_id', portfolio.id)
      .eq('stock_id', stockId)
      .maybeSingle();

    if (!holding || holding.quantity < quantity) throw new Error('Insufficient shares');

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    const totalProceeds = stock.current_price * quantity;
    const newBalance = portfolio.cash_balance + totalProceeds;

    await supabase.from('portfolios').update({ cash_balance: newBalance }).eq('id', portfolio.id);

    if (holding.quantity === quantity) {
      await supabase.from('holdings').delete().eq('id', holding.id);
    } else {
      await supabase.from('holdings').update({ quantity: holding.quantity - quantity }).eq('id', holding.id);
    }

    await supabase.from('transactions').insert({
      portfolio_id: portfolio.id,
      stock_id: stockId,
      transaction_type: 'SELL',
      quantity,
      price_per_share: stock.current_price,
      total_amount: totalProceeds,
      simulated_year: simulatedYear,
    });

    setPortfolio(prev => prev ? { ...prev, cash_balance: newBalance } : null);
    await fetchHoldings();

    return { success: true };
  };

  // Buy mutual fund
  const buyMutualFund = async (fundId: string, amount: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const fund = mutualFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');
    if (amount > portfolio.cash_balance) throw new Error('Insufficient balance');

    const unitsToBuy = amount / fund.nav;
    const newBalance = portfolio.cash_balance - amount;

    const { data: existingHolding } = await supabase
      .from('mutual_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolio.id)
      .eq('mutual_fund_id', fundId)
      .maybeSingle();

    await supabase.from('portfolios').update({ cash_balance: newBalance }).eq('id', portfolio.id);

    if (existingHolding) {
      const totalUnits = Number(existingHolding.units) + unitsToBuy;
      const totalInvested = (Number(existingHolding.average_nav) * Number(existingHolding.units)) + amount;
      const newAvgNav = totalInvested / totalUnits;

      await supabase
        .from('mutual_fund_holdings')
        .update({ units: totalUnits, average_nav: newAvgNav })
        .eq('id', existingHolding.id);
    } else {
      await supabase.from('mutual_fund_holdings').insert({
        portfolio_id: portfolio.id,
        mutual_fund_id: fundId,
        units: unitsToBuy,
        average_nav: fund.nav,
      });
    }

    setPortfolio(prev => prev ? { ...prev, cash_balance: newBalance } : null);
    await fetchMfHoldings();

    return { success: true, units: unitsToBuy };
  };

  // Sell mutual fund
  const sellMutualFund = async (fundId: string, units: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const { data: holding } = await supabase
      .from('mutual_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolio.id)
      .eq('mutual_fund_id', fundId)
      .maybeSingle();

    if (!holding || Number(holding.units) < units) throw new Error('Insufficient units');

    const fund = mutualFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');

    const totalProceeds = fund.nav * units;
    const newBalance = portfolio.cash_balance + totalProceeds;

    await supabase.from('portfolios').update({ cash_balance: newBalance }).eq('id', portfolio.id);

    if (Number(holding.units) === units) {
      await supabase.from('mutual_fund_holdings').delete().eq('id', holding.id);
    } else {
      await supabase.from('mutual_fund_holdings').update({ units: Number(holding.units) - units }).eq('id', holding.id);
    }

    setPortfolio(prev => prev ? { ...prev, cash_balance: newBalance } : null);
    await fetchMfHoldings();

    return { success: true };
  };

  // Buy index fund
  const buyIndexFund = async (fundId: string, amount: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const fund = indexFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');
    if (amount > portfolio.cash_balance) throw new Error('Insufficient balance');

    const unitsToBuy = amount / fund.nav;
    const newBalance = portfolio.cash_balance - amount;

    const { data: existingHolding } = await supabase
      .from('index_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolio.id)
      .eq('index_fund_id', fundId)
      .maybeSingle();

    await supabase.from('portfolios').update({ cash_balance: newBalance }).eq('id', portfolio.id);

    if (existingHolding) {
      const totalUnits = Number(existingHolding.units) + unitsToBuy;
      const totalInvested = (Number(existingHolding.average_nav) * Number(existingHolding.units)) + amount;
      const newAvgNav = totalInvested / totalUnits;

      await supabase
        .from('index_fund_holdings')
        .update({ units: totalUnits, average_nav: newAvgNav })
        .eq('id', existingHolding.id);
    } else {
      await supabase.from('index_fund_holdings').insert({
        portfolio_id: portfolio.id,
        index_fund_id: fundId,
        units: unitsToBuy,
        average_nav: fund.nav,
      });
    }

    setPortfolio(prev => prev ? { ...prev, cash_balance: newBalance } : null);
    await fetchIfHoldings();

    return { success: true, units: unitsToBuy };
  };

  // Sell index fund
  const sellIndexFund = async (fundId: string, units: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const { data: holding } = await supabase
      .from('index_fund_holdings')
      .select('id, units, average_nav')
      .eq('portfolio_id', portfolio.id)
      .eq('index_fund_id', fundId)
      .maybeSingle();

    if (!holding || Number(holding.units) < units) throw new Error('Insufficient units');

    const fund = indexFunds.find(f => f.id === fundId);
    if (!fund) throw new Error('Fund not found');

    const totalProceeds = fund.nav * units;
    const newBalance = portfolio.cash_balance + totalProceeds;

    await supabase.from('portfolios').update({ cash_balance: newBalance }).eq('id', portfolio.id);

    if (Number(holding.units) === units) {
      await supabase.from('index_fund_holdings').delete().eq('id', holding.id);
    } else {
      await supabase.from('index_fund_holdings').update({ units: Number(holding.units) - units }).eq('id', holding.id);
    }

    setPortfolio(prev => prev ? { ...prev, cash_balance: newBalance } : null);
    await fetchIfHoldings();

    return { success: true };
  };

  // Reset simulation
  const resetSimulation = useCallback(async () => {
    if (!user || !portfolio) return;
    
    await supabase.from('holdings').delete().eq('portfolio_id', portfolio.id);
    await supabase.from('mutual_fund_holdings').delete().eq('portfolio_id', portfolio.id);
    await supabase.from('index_fund_holdings').delete().eq('portfolio_id', portfolio.id);
    
    await supabase.from('portfolios').update({ 
      cash_balance: 100000, 
      simulated_year: 1,
      year_started_at: new Date().toISOString()
    }).eq('id', portfolio.id);
    
    yearlyPricesRef.current.clear();
    navCacheRef.current.clear();
    setSimulatedYear(1);
    setPortfolioHistory([]);
    setSimulationEnded(false);
    setEndData(null);
    lastYearRef.current = 1;
    setHoldings([]);
    setMfHoldings([]);
    setIfHoldings([]);
    
    await fetchPortfolio();
    await fetchStocks(1);
    await fetchMutualFunds(1);
    await fetchIndexFunds(1);
  }, [user, portfolio, fetchPortfolio, fetchStocks, fetchMutualFunds, fetchIndexFunds]);

  // Calculate metrics - FIXED: invested = 100000 - cash (money moved from cash to investments)
  const cashBalance = portfolio?.cash_balance || 100000;
  const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const mfValue = mfHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const ifValue = ifHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  
  // Total value = cash + all holdings current value
  const totalValue = cashBalance + holdingsValue + mfValue + ifValue;
  
  // Invested value = Initial amount - remaining cash = money put into investments
  const investedValue = 100000 - cashBalance;
  
  // Unrealized P&L = current holdings value - amount invested in them
  const stocksInvested = holdings.reduce((sum, h) => sum + (h.average_buy_price * h.quantity), 0);
  const mfInvested = mfHoldings.reduce((sum, h) => sum + (h.average_nav * h.units), 0);
  const ifInvested = ifHoldings.reduce((sum, h) => sum + (h.average_nav * h.units), 0);
  const totalInvestedInHoldings = stocksInvested + mfInvested + ifInvested;
  const totalHoldingsValue = holdingsValue + mfValue + ifValue;
  const unrealizedPL = totalHoldingsValue - totalInvestedInHoldings;
  
  const metrics = {
    totalValue,
    investedValue,
    cashBalance,
    unrealizedPL,
    unrealizedPLPercent: totalInvestedInHoldings > 0 ? (unrealizedPL / totalInvestedInHoldings) * 100 : 0,
    riskScore: calculateRiskScore(holdings),
  };

  const mfMetrics = {
    totalValue: mfValue,
    investedValue: mfInvested,
    unrealizedPL: mfValue - mfInvested,
  };

  const ifMetrics = {
    totalValue: ifValue,
    investedValue: ifInvested,
    unrealizedPL: ifValue - ifInvested,
  };

  function calculateRiskScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 20;
    const totalVal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    if (totalVal === 0) return 20;

    const maxConcentration = Math.max(...holdings.map(h => h.currentValue / totalVal));
    const highRiskExposure = holdings
      .filter(h => h.stock.risk_level === 'High')
      .reduce((sum, h) => sum + h.currentValue, 0) / totalVal;
    const sectors = new Set(holdings.map(h => h.stock.sector));
    const diversificationBonus = Math.min(sectors.size * 5, 25);

    return Math.min(100, Math.round((maxConcentration * 50) + (highRiskExposure * 30) - diversificationBonus + 20));
  }

  const refreshData = useCallback(() => {
    fetchStocks();
    fetchMutualFunds();
    fetchIndexFunds();
    fetchHoldings();
    fetchMfHoldings();
    fetchIfHoldings();
  }, [fetchStocks, fetchMutualFunds, fetchIndexFunds, fetchHoldings, fetchMfHoldings, fetchIfHoldings]);

  // Initialize on user login
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      
      const [stockData, mfData, ifData] = await Promise.all([
        fetchStocks(),
        fetchMutualFunds(),
        fetchIndexFunds(),
      ]);
      
      const portfolioData = await fetchPortfolio();
      
      if (portfolioData && stockData) {
        await fetchHoldings(stockData);
      }
      if (portfolioData && mfData) {
        await fetchMfHoldings(mfData);
      }
      if (portfolioData && ifData) {
        await fetchIfHoldings(ifData);
      }
      
      isInitializedRef.current = true;
      setLoading(false);
    };

    init();
  }, [user]);

  // GLOBAL live price updates - runs even when not on simulator page
  useEffect(() => {
    const interval = setInterval(() => {
      // Update stocks
      setStocks(prev => prev.map(stock => {
        const riskLevel = stock.risk_level || 'Medium';
        const maxFluctuation = INTRADAY_FLUCTUATION[riskLevel as keyof typeof INTRADAY_FLUCTUATION] || INTRADAY_FLUCTUATION.Medium;
        const fluctuation = 1 + (Math.random() - 0.5) * 2 * maxFluctuation;
        const newPrice = stock.yearlyPrice * fluctuation;
        const change = newPrice - stock.base_price;
        const changePercent = (change / stock.base_price) * 100;
        
        return {
          ...stock,
          current_price: Math.round(newPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        };
      }));

      // Update mutual funds
      setMutualFunds(prev => prev.map(fund => {
        const category = fund.category as keyof typeof FUND_INTRADAY;
        const maxFluctuation = FUND_INTRADAY[category] || FUND_INTRADAY.large_cap;
        const fluctuation = 1 + (Math.random() - 0.5) * 2 * maxFluctuation;
        const newNav = fund.yearlyNav * fluctuation;
        const change = newNav - fund.base_nav;
        const changePercent = (change / fund.base_nav) * 100;
        
        return {
          ...fund,
          nav: Math.round(newNav * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        };
      }));

      // Update index funds
      setIndexFunds(prev => prev.map(fund => {
        const maxFluctuation = FUND_INTRADAY.index;
        const fluctuation = 1 + (Math.random() - 0.5) * 2 * maxFluctuation;
        const newNav = fund.yearlyNav * fluctuation;
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

  // Update holdings values when prices change
  useEffect(() => {
    if (stocks.length > 0 && holdings.length > 0) {
      setHoldings(prev => prev.map(h => {
        const stock = stocks.find(s => s.id === h.stock_id);
        if (!stock) return h;
        
        const currentValue = stock.current_price * h.quantity;
        const investedVal = h.average_buy_price * h.quantity;
        const profitLoss = currentValue - investedVal;
        const profitLossPercent = investedVal > 0 ? (profitLoss / investedVal) * 100 : 0;
        
        return { ...h, stock, currentValue, profitLoss, profitLossPercent };
      }));
    }
  }, [stocks]);

  useEffect(() => {
    if (mutualFunds.length > 0 && mfHoldings.length > 0) {
      setMfHoldings(prev => prev.map(h => {
        const fund = mutualFunds.find(f => f.id === h.mutual_fund_id);
        if (!fund) return h;
        
        const currentValue = fund.nav * h.units;
        const investedVal = h.average_nav * h.units;
        const profitLoss = currentValue - investedVal;
        const profitLossPercent = investedVal > 0 ? (profitLoss / investedVal) * 100 : 0;
        
        return { ...h, fund, currentValue, profitLoss, profitLossPercent };
      }));
    }
  }, [mutualFunds]);

  useEffect(() => {
    if (indexFunds.length > 0 && ifHoldings.length > 0) {
      setIfHoldings(prev => prev.map(h => {
        const fund = indexFunds.find(f => f.id === h.index_fund_id);
        if (!fund) return h;
        
        const currentValue = fund.nav * h.units;
        const investedVal = h.average_nav * h.units;
        const profitLoss = currentValue - investedVal;
        const profitLossPercent = investedVal > 0 ? (profitLoss / investedVal) * 100 : 0;
        
        return { ...h, fund, currentValue, profitLoss, profitLossPercent };
      }));
    }
  }, [indexFunds]);

  // Check time progression
  useEffect(() => {
    if (!portfolio) return;

    const checkTime = async () => {
      const currentYear = calculateSimulatedYear(portfolio.year_started_at);
      if (currentYear !== simulatedYear) {
        setSimulatedYear(currentYear);
        await fetchStocks(currentYear);
        await fetchMutualFunds(currentYear);
        await fetchIndexFunds(currentYear);
      }
    };

    const interval = setInterval(checkTime, 60 * 1000);
    return () => clearInterval(interval);
  }, [portfolio, simulatedYear, calculateSimulatedYear, fetchStocks, fetchMutualFunds, fetchIndexFunds]);

  // Check simulation end
  useEffect(() => {
    if (simulatedYear >= MAX_SIMULATION_YEARS && !simulationEnded && portfolio) {
      setEndData({
        finalYear: simulatedYear,
        totalValue,
        holdings: [...holdings],
        portfolioHistory: [...portfolioHistory],
        cashBalance: portfolio.cash_balance,
      });
      setSimulationEnded(true);
    }
  }, [simulatedYear, simulationEnded, portfolio, holdings, portfolioHistory, totalValue]);

  return (
    <SimulationContext.Provider value={{
      stocks,
      portfolio,
      holdings,
      mutualFunds,
      indexFunds,
      mfHoldings,
      ifHoldings,
      simulatedYear,
      portfolioHistory,
      loading,
      simulationEnded,
      endData,
      maxYears: MAX_SIMULATION_YEARS,
      metrics,
      mfMetrics,
      ifMetrics,
      buyStock,
      sellStock,
      buyMutualFund,
      sellMutualFund,
      buyIndexFund,
      sellIndexFund,
      resetSimulation,
      refreshData,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
