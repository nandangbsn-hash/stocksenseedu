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

const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes = prices update
const YEAR_DURATION = 24 * 60 * 60 * 1000; // 1 real day = 1 simulated year

// Reasonable annual volatility ranges by risk level
const ANNUAL_VOLATILITY = {
  High: { min: -0.35, max: 0.50 },   // High risk: -35% to +50% per year
  Medium: { min: -0.20, max: 0.30 }, // Medium risk: -20% to +30% per year
  Low: { min: -0.10, max: 0.18 },    // Low risk: -10% to +18% per year
};

// Market trend factor (simulates market sentiment)
function getMarketTrend(): number {
  // Slight positive bias (markets tend to go up over long term)
  return 0.02 + (Math.random() - 0.4) * 0.1; // -0.02 to +0.08
}

export function useStockSimulation() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedYear, setSimulatedYear] = useState(1);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  
  const lastYearRef = useRef<number>(1);
  const pricesRef = useRef<Map<string, number>>(new Map());

  // Calculate simulated year from portfolio start time
  const calculateSimulatedYear = useCallback((yearStartedAt: string, baseYear: number) => {
    const startDate = new Date(yearStartedAt);
    const now = new Date();
    const elapsed = now.getTime() - startDate.getTime();
    const yearsElapsed = Math.floor(elapsed / YEAR_DURATION);
    return Math.min(baseYear + yearsElapsed, 30); // Cap at 30 years
  }, []);

  // Apply annual price changes based on volatility and market trend
  const applyAnnualPriceChange = useCallback((basePrice: number, riskLevel: string, yearsPassed: number) => {
    const volatility = ANNUAL_VOLATILITY[riskLevel as keyof typeof ANNUAL_VOLATILITY] || ANNUAL_VOLATILITY.Medium;
    
    // Compound the price changes over years
    let price = basePrice;
    for (let i = 0; i < yearsPassed; i++) {
      const marketTrend = getMarketTrend();
      const randomChange = volatility.min + Math.random() * (volatility.max - volatility.min);
      const totalChange = 1 + randomChange + marketTrend;
      price = price * Math.max(0.1, totalChange); // Floor at 10% of original to prevent going to 0
    }
    
    return Math.round(price * 100) / 100;
  }, []);

  // Fetch stocks with price simulation
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
    
    // Simulate price changes based on years passed
    const simulatedStocks = data.map(stock => {
      // Use cached price if same year, otherwise recalculate
      const cacheKey = `${stock.id}-${year}`;
      let newPrice: number;
      
      if (pricesRef.current.has(cacheKey)) {
        newPrice = pricesRef.current.get(cacheKey)!;
      } else {
        // Apply reasonable annual volatility
        newPrice = applyAnnualPriceChange(
          Number(stock.base_price),
          stock.risk_level || 'Medium',
          year - 1
        );
        
        // Add small intra-day fluctuation (within 5-minute update)
        const intraDayChange = 1 + (Math.random() - 0.5) * 0.02; // ±1%
        newPrice = newPrice * intraDayChange;
        
        pricesRef.current.set(cacheKey, newPrice);
      }
      
      const change = newPrice - Number(stock.base_price);
      const changePercent = (change / Number(stock.base_price)) * 100;

      return {
        ...stock,
        base_price: Number(stock.base_price),
        current_price: Math.round(newPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    });

    setStocks(simulatedStocks);
    return simulatedStocks;
  }, [simulatedYear, applyAnnualPriceChange]);

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
      const currentYear = calculateSimulatedYear(data.year_started_at, data.simulated_year);
      
      // If year changed, update portfolio in DB and recalculate prices
      if (currentYear !== lastYearRef.current && currentYear > data.simulated_year) {
        // Update simulated year in database
        await supabase
          .from('portfolios')
          .update({ simulated_year: currentYear })
          .eq('id', data.id);
        
        // Clear price cache for new year
        pricesRef.current.clear();
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

  // Fetch holdings from database (fresh query to avoid stale data)
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
    
    // Update portfolio history
    updatePortfolioHistory(holdingsWithCalcs || [], portfolio.cash_balance);
  }, [user, portfolio, stocks]);

  // Update portfolio history for chart
  const updatePortfolioHistory = useCallback((currentHoldings: Holding[], cashBalance: number) => {
    const totalInvested = currentHoldings.reduce((sum, h) => sum + (h.average_buy_price * h.quantity), 0);
    const totalValue = cashBalance + currentHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    
    setPortfolioHistory(prev => {
      // Only add if year changed
      if (prev.length > 0 && prev[prev.length - 1].year === simulatedYear) {
        // Update current year
        return [...prev.slice(0, -1), { year: simulatedYear, totalValue, invested: totalInvested }];
      }
      // Add new year
      return [...prev, { year: simulatedYear, totalValue, invested: totalInvested }];
    });
  }, [simulatedYear]);

  // Buy stock - with proper upsert logic to handle unique constraint
  const buyStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    const totalCost = stock.current_price * quantity;
    if (totalCost > portfolio.cash_balance) {
      throw new Error('Insufficient balance');
    }

    // Check for existing holding in database (fresh query to avoid stale data)
    const { data: existingHolding, error: holdingError } = await supabase
      .from('holdings')
      .select('id, quantity, average_buy_price')
      .eq('portfolio_id', portfolio.id)
      .eq('stock_id', stockId)
      .maybeSingle();

    if (holdingError) throw holdingError;

    // Update cash balance first
    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: portfolio.cash_balance - totalCost })
      .eq('id', portfolio.id);

    if (balanceError) throw balanceError;

    if (existingHolding) {
      // Update existing holding with new average price
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
      // Create new holding
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

    // Record transaction
    await supabase.from('transactions').insert({
      portfolio_id: portfolio.id,
      stock_id: stockId,
      transaction_type: 'BUY',
      quantity,
      price_per_share: stock.current_price,
      total_amount: totalCost,
      simulated_year: simulatedYear,
    });

    // Refresh data
    await fetchPortfolio();
    await fetchHoldings();

    return { success: true };
  };

  // Sell stock
  const sellStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    // Fresh query for holding
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

    // Update cash balance
    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: portfolio.cash_balance + totalProceeds })
      .eq('id', portfolio.id);

    if (balanceError) throw balanceError;

    if (holding.quantity === quantity) {
      // Delete holding
      await supabase.from('holdings').delete().eq('id', holding.id);
    } else {
      // Update holding
      await supabase
        .from('holdings')
        .update({ quantity: holding.quantity - quantity })
        .eq('id', holding.id);
    }

    // Record transaction
    await supabase.from('transactions').insert({
      portfolio_id: portfolio.id,
      stock_id: stockId,
      transaction_type: 'SELL',
      quantity,
      price_per_share: stock.current_price,
      total_amount: totalProceeds,
      simulated_year: simulatedYear,
    });

    // Refresh data
    await fetchPortfolio();
    await fetchHoldings();

    return { success: true };
  };

  // Calculate portfolio metrics
  const metrics = {
    totalValue: (portfolio?.cash_balance || 0) + holdings.reduce((sum, h) => sum + h.currentValue, 0),
    investedValue: holdings.reduce((sum, h) => sum + (h.average_buy_price * h.quantity), 0),
    cashBalance: portfolio?.cash_balance || 0,
    unrealizedPL: holdings.reduce((sum, h) => sum + h.profitLoss, 0),
    unrealizedPLPercent: holdings.length > 0 
      ? (holdings.reduce((sum, h) => sum + h.profitLoss, 0) / 
         holdings.reduce((sum, h) => sum + (h.average_buy_price * h.quantity), 0)) * 100
      : 0,
    riskScore: calculateRiskScore(holdings),
  };

  function calculateRiskScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 20;
    
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    if (totalValue === 0) return 20;

    // Concentration risk
    const maxConcentration = Math.max(...holdings.map(h => h.currentValue / totalValue));
    
    // High-risk stock exposure
    const highRiskExposure = holdings
      .filter(h => h.stock.risk_level === 'High')
      .reduce((sum, h) => sum + h.currentValue, 0) / totalValue;

    // Number of different sectors
    const sectors = new Set(holdings.map(h => h.stock.sector));
    const diversificationBonus = Math.min(sectors.size * 5, 25);

    return Math.min(100, Math.round(
      (maxConcentration * 50) + 
      (highRiskExposure * 30) - 
      diversificationBonus + 20
    ));
  }

  // Time acceleration checker - runs every minute
  useEffect(() => {
    if (!portfolio) return;

    const checkTimeProgression = () => {
      const currentYear = calculateSimulatedYear(portfolio.year_started_at, 1);
      
      if (currentYear !== simulatedYear) {
        // Year changed! Update prices and portfolio
        pricesRef.current.clear(); // Clear price cache
        setSimulatedYear(currentYear);
        fetchStocks(currentYear);
      }
    };

    const interval = setInterval(checkTimeProgression, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [portfolio, simulatedYear, calculateSimulatedYear, fetchStocks]);

  // Initialize and update prices every 5 minutes
  useEffect(() => {
    fetchStocks();
    
    const interval = setInterval(() => {
      // Small intra-day price fluctuations
      setStocks(prev => prev.map(stock => {
        const fluctuation = 1 + (Math.random() - 0.5) * 0.02; // ±1%
        const newPrice = stock.current_price * fluctuation;
        const change = newPrice - stock.base_price;
        const changePercent = (change / stock.base_price) * 100;
        
        return {
          ...stock,
          current_price: Math.round(newPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
        };
      }));
    }, PRICE_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
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
    buyStock,
    sellStock,
    refreshData: () => {
      fetchStocks();
      fetchPortfolio();
      fetchHoldings();
    },
  };
}
