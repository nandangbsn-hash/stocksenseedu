import { useState, useEffect, useCallback } from 'react';
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

const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const YEAR_DURATION = 24 * 60 * 60 * 1000; // 1 day = 1 year

export function useStockSimulation() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedYear, setSimulatedYear] = useState(1);

  // Fetch stocks
  const fetchStocks = useCallback(async () => {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('symbol');

    if (error) {
      console.error('Error fetching stocks:', error);
      return;
    }

    // Apply price simulation with volatility
    const simulatedStocks = data.map(stock => {
      const volatility = stock.risk_level === 'High' ? 0.15 : 
                         stock.risk_level === 'Medium' ? 0.08 : 0.04;
      
      const randomFactor = 1 + (Math.random() - 0.5) * 2 * volatility;
      const newPrice = Number(stock.current_price) * randomFactor;
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
  }, []);

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
      // Calculate simulated year based on time elapsed
      const startDate = new Date(data.year_started_at);
      const now = new Date();
      const elapsed = now.getTime() - startDate.getTime();
      const yearsElapsed = Math.floor(elapsed / YEAR_DURATION);
      const currentYear = data.simulated_year + yearsElapsed;
      
      setSimulatedYear(Math.min(currentYear, 30));
      setPortfolio({
        ...data,
        cash_balance: Number(data.cash_balance),
      });
    }
  }, [user]);

  // Fetch holdings
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
      const profitLossPercent = (profitLoss / investedValue) * 100;

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
  }, [user, portfolio, stocks]);

  // Buy stock
  const buyStock = async (stockId: string, quantity: number) => {
    if (!user || !portfolio) throw new Error('Not authenticated');

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) throw new Error('Stock not found');

    const totalCost = stock.current_price * quantity;
    if (totalCost > portfolio.cash_balance) {
      throw new Error('Insufficient balance');
    }

    // Update cash balance
    const { error: balanceError } = await supabase
      .from('portfolios')
      .update({ cash_balance: portfolio.cash_balance - totalCost })
      .eq('id', portfolio.id);

    if (balanceError) throw balanceError;

    // Check if holding exists
    const existingHolding = holdings.find(h => h.stock_id === stockId);

    if (existingHolding) {
      // Update existing holding with new average price
      const totalShares = existingHolding.quantity + quantity;
      const totalInvested = (existingHolding.average_buy_price * existingHolding.quantity) + totalCost;
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

    const holding = holdings.find(h => h.stock_id === stockId);
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

  // Initialize and update
  useEffect(() => {
    fetchStocks();
    
    // Update prices every 5 minutes
    const interval = setInterval(fetchStocks, PRICE_UPDATE_INTERVAL);
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
