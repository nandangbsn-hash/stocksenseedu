import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  // Internal tracking for stable simulation
  yearlyPrice: number; // Price at start of current year (for stable reference)
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

const YEAR_DURATION = 24 * 60 * 60 * 1000; // 1 real day = 1 simulated year

// Annual volatility ranges - realistic ranges for Indian stocks
const ANNUAL_VOLATILITY = {
  High: { min: -0.40, max: 0.60 },   // High risk: -40% to +60% per year (small caps, volatile sectors)
  Medium: { min: -0.25, max: 0.40 }, // Medium risk: -25% to +40% per year 
  Low: { min: -0.12, max: 0.22 },    // Low risk: -12% to +22% per year (large cap, stable)
};

// Small intra-day fluctuation limits (tiny, realistic noise)
const INTRADAY_FLUCTUATION = {
  High: 0.003,   // ±0.3% per tick
  Medium: 0.002, // ±0.2% per tick  
  Low: 0.001,    // ±0.1% per tick
};

const MAX_SIMULATION_YEARS = 20;
const LIVE_UPDATE_INTERVAL = 15 * 1000; // Update every 15 seconds for small fluctuations

// Seeded random for consistent year-over-year returns per stock
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function useStockSimulation() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedYear, setSimulatedYear] = useState(1);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [endData, setEndData] = useState<SimulationEndData | null>(null);
  
  const lastYearRef = useRef<number>(1);
  // Store stable yearly prices per stock per year
  const yearlyPricesRef = useRef<Map<string, number>>(new Map());

  // Calculate simulated year from portfolio start time
  const calculateSimulatedYear = useCallback((yearStartedAt: string, baseYear: number) => {
    const startDate = new Date(yearStartedAt);
    const now = new Date();
    const elapsed = now.getTime() - startDate.getTime();
    const yearsElapsed = Math.floor(elapsed / YEAR_DURATION);
    return Math.min(baseYear + yearsElapsed, MAX_SIMULATION_YEARS);
  }, []);

  // Calculate year-over-year price with seeded randomness (deterministic per stock per year)
  const calculateYearlyPrice = useCallback((stockId: string, basePrice: number, riskLevel: string, year: number): number => {
    const cacheKey = `${stockId}-${year}`;
    
    if (yearlyPricesRef.current.has(cacheKey)) {
      return yearlyPricesRef.current.get(cacheKey)!;
    }
    
    const volatility = ANNUAL_VOLATILITY[riskLevel as keyof typeof ANNUAL_VOLATILITY] || ANNUAL_VOLATILITY.Medium;
    
    let price = basePrice;
    for (let y = 1; y < year; y++) {
      // Use seeded random for consistent returns each year
      const seed = parseInt(stockId.replace(/-/g, '').slice(0, 8), 16) + y;
      const rand = seededRandom(seed);
      
      // Market trend (slight positive bias - markets tend to go up)
      const marketBias = 0.06; // 6% average market return
      
      // Annual change within volatility range
      const annualReturn = volatility.min + rand * (volatility.max - volatility.min) + marketBias * (rand > 0.3 ? 1 : -0.5);
      
      price = price * (1 + annualReturn);
      price = Math.max(price, basePrice * 0.1); // Floor at 10% of base
    }
    
    const finalPrice = Math.round(price * 100) / 100;
    yearlyPricesRef.current.set(cacheKey, finalPrice);
    
    return finalPrice;
  }, []);

  // Fetch stocks and calculate yearly prices
  const fetchStocks = useCallback(async (currentYear?: number) => {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('symbol');

    if (error) {
      console.error('Error fetching stocks:', error);
      return;
    }

    const year = currentYear || simulatedYear;
    
    const simulatedStocks = data.map(stock => {
      const yearlyPrice = calculateYearlyPrice(
        stock.id,
        Number(stock.base_price),
        stock.risk_level || 'Medium',
        year
      );
      
      const change = yearlyPrice - Number(stock.base_price);
      const changePercent = (change / Number(stock.base_price)) * 100;

      return {
        ...stock,
        base_price: Number(stock.base_price),
        current_price: yearlyPrice,
        yearlyPrice: yearlyPrice, // Store stable reference
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      } as Stock;
    });

    setStocks(simulatedStocks);
    return simulatedStocks;
  }, [simulatedYear, calculateYearlyPrice]);

  // Fetch user portfolio
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
      const currentYear = calculateSimulatedYear(data.year_started_at, 1);
      
      // If year changed, update portfolio in DB
      if (currentYear !== lastYearRef.current && currentYear > data.simulated_year) {
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
    }
  }, [user, calculateSimulatedYear]);

  // Fetch holdings from database
  const fetchHoldings = useCallback(async () => {
    if (!user || !portfolio) return;

    const { data, error } = await supabase
      .from('holdings')
      .select(`
        id,
        stock_id,
        quantity,
        average_buy_price,
        stocks (
          id, symbol, name, sector, industry, base_price, current_price, risk_level, market_cap, description
        )
      `)
      .eq('portfolio_id', portfolio.id);

    if (error) {
      console.error('Error fetching holdings:', error);
      return;
    }

    const holdingsWithCalcs = data?.map(h => {
      const stock = stocks.find(s => s.id === h.stock_id);
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
    
    updatePortfolioHistory(holdingsWithCalcs || [], portfolio.cash_balance);
  }, [user, portfolio, stocks]);

  // Update portfolio history for chart
  const updatePortfolioHistory = useCallback((currentHoldings: Holding[], cashBalance: number) => {
    const totalInvested = currentHoldings.reduce((sum, h) => sum + (h.average_buy_price * h.quantity), 0);
    const totalValue = cashBalance + currentHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    
    setPortfolioHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].year === simulatedYear) {
        return [...prev.slice(0, -1), { year: simulatedYear, totalValue, invested: totalInvested }];
      }
      return [...prev, { year: simulatedYear, totalValue, invested: totalInvested }];
    });
  }, [simulatedYear]);

  // Buy stock
  const buyStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    const totalCost = stock.current_price * quantity;
    if (totalCost > portfolio.cash_balance) {
      throw new Error('Insufficient balance');
    }

    const { data: existingHolding, error: holdingError } = await supabase
      .from('holdings')
      .select('id, quantity, average_buy_price')
      .eq('portfolio_id', portfolio.id)
      .eq('stock_id', stockId)
      .maybeSingle();

    if (holdingError) throw holdingError;

    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: portfolio.cash_balance - totalCost })
      .eq('id', portfolio.id);

    if (balanceError) throw balanceError;

    if (existingHolding) {
      const currentQty = existingHolding.quantity;
      const currentAvgPrice = Number(existingHolding.average_buy_price);
      const totalShares = currentQty + quantity;
      const totalInvested = (currentAvgPrice * currentQty) + totalCost;
      const newAvgPrice = totalInvested / totalShares;

      const { error } = await supabase
        .from('holdings')
        .update({
          quantity: totalShares,
          average_buy_price: newAvgPrice,
        })
        .eq('id', existingHolding.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('holdings')
        .insert({
          portfolio_id: portfolio.id,
          stock_id: stockId,
          quantity,
          average_buy_price: stock.current_price,
        });

      if (error) throw error;
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

    await fetchPortfolio();
    await fetchHoldings();

    return { success: true };
  };

  // Sell stock
  const sellStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const { data: holding, error: holdingError } = await supabase
      .from('holdings')
      .select('id, quantity, average_buy_price')
      .eq('portfolio_id', portfolio.id)
      .eq('stock_id', stockId)
      .maybeSingle();

    if (holdingError) throw holdingError;
    if (!holding || holding.quantity < quantity) {
      throw new Error('Insufficient shares');
    }

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    const totalProceeds = stock.current_price * quantity;

    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: portfolio.cash_balance + totalProceeds })
      .eq('id', portfolio.id);

    if (balanceError) throw balanceError;

    if (holding.quantity === quantity) {
      await supabase.from('holdings').delete().eq('id', holding.id);
    } else {
      await supabase
        .from('holdings')
        .update({ quantity: holding.quantity - quantity })
        .eq('id', holding.id);
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

    await fetchPortfolio();
    await fetchHoldings();

    return { success: true };
  };

  // Calculate portfolio metrics
  const cashBalance = portfolio?.cash_balance || 100000;
  const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const investedValue = holdings.reduce((sum, h) => sum + (h.average_buy_price * h.quantity), 0);
  const unrealizedPL = holdings.reduce((sum, h) => sum + h.profitLoss, 0);
  
  const metrics = {
    totalValue: cashBalance + holdingsValue,
    investedValue,
    cashBalance,
    unrealizedPL,
    unrealizedPLPercent: investedValue > 0 ? (unrealizedPL / investedValue) * 100 : 0,
    riskScore: calculateRiskScore(holdings),
  };

  function calculateRiskScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 20;
    
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    if (totalValue === 0) return 20;

    const maxConcentration = Math.max(...holdings.map(h => h.currentValue / totalValue));
    const highRiskExposure = holdings
      .filter(h => h.stock.risk_level === 'High')
      .reduce((sum, h) => sum + h.currentValue, 0) / totalValue;
    const sectors = new Set(holdings.map(h => h.stock.sector));
    const diversificationBonus = Math.min(sectors.size * 5, 25);

    return Math.min(100, Math.round(
      (maxConcentration * 50) + 
      (highRiskExposure * 30) - 
      diversificationBonus + 20
    ));
  }

  // Time acceleration checker
  useEffect(() => {
    if (!portfolio) return;

    const checkTimeProgression = async () => {
      const currentYear = calculateSimulatedYear(portfolio.year_started_at, 1);
      
      if (currentYear !== simulatedYear) {
        setSimulatedYear(currentYear);
        await fetchStocks(currentYear);
        await fetchHoldings();
      }
    };

    const interval = setInterval(checkTimeProgression, 60 * 1000);
    return () => clearInterval(interval);
  }, [portfolio, simulatedYear, calculateSimulatedYear, fetchStocks, fetchHoldings]);

  // Check if simulation should end
  useEffect(() => {
    if (simulatedYear >= MAX_SIMULATION_YEARS && !simulationEnded && portfolio) {
      const totalValue = (portfolio.cash_balance || 0) + holdings.reduce((sum, h) => sum + h.currentValue, 0);
      setEndData({
        finalYear: simulatedYear,
        totalValue,
        holdings: [...holdings],
        portfolioHistory: [...portfolioHistory],
        cashBalance: portfolio.cash_balance,
      });
      setSimulationEnded(true);
    }
  }, [simulatedYear, simulationEnded, portfolio, holdings, portfolioHistory]);

  // Reset simulation
  const resetSimulation = useCallback(async () => {
    if (!user || !portfolio) return;
    
    await supabase.from('holdings').delete().eq('portfolio_id', portfolio.id);
    
    await supabase
      .from('portfolios')
      .update({ 
        cash_balance: 100000, 
        simulated_year: 1,
        year_started_at: new Date().toISOString()
      })
      .eq('id', portfolio.id);
    
    yearlyPricesRef.current.clear();
    setSimulatedYear(1);
    setPortfolioHistory([]);
    setSimulationEnded(false);
    setEndData(null);
    lastYearRef.current = 1;
    
    await fetchPortfolio();
    await fetchStocks(1);
    await fetchHoldings();
  }, [user, portfolio, fetchPortfolio, fetchStocks, fetchHoldings]);

  // Initialize stocks and apply small live fluctuations
  useEffect(() => {
    fetchStocks();
    
    // Small live fluctuations based on yearlyPrice (not compounding)
    const liveInterval = setInterval(() => {
      setStocks(prev => prev.map(stock => {
        const riskLevel = stock.risk_level || 'Medium';
        const maxFluctuation = INTRADAY_FLUCTUATION[riskLevel as keyof typeof INTRADAY_FLUCTUATION] || INTRADAY_FLUCTUATION.Medium;
        
        // Fluctuate around the stable yearly price (not current_price)
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
    }, LIVE_UPDATE_INTERVAL);
    
    return () => clearInterval(liveInterval);
  }, [fetchStocks]);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user, fetchPortfolio]);

  useEffect(() => {
    if (portfolio && stocks.length > 0) {
      fetchHoldings();
      setLoading(false);
    }
  }, [portfolio, stocks, fetchHoldings]);

  return {
    stocks,
    portfolio,
    holdings,
    metrics,
    simulatedYear,
    portfolioHistory,
    loading,
    simulationEnded,
    endData,
    maxYears: MAX_SIMULATION_YEARS,
    buyStock,
    sellStock,
    resetSimulation,
    refreshData: () => {
      fetchStocks();
      fetchPortfolio();
      fetchHoldings();
    },
  };
}
