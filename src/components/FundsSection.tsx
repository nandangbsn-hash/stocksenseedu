import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Layers,
  BarChart3,
  Landmark,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FundCard } from "./FundCard";
import { MutualFund, IndexFund, MutualFundHolding, IndexFundHolding } from "@/contexts/SimulationContext";

interface FundsSectionProps {
  mutualFunds: MutualFund[];
  indexFunds: IndexFund[];
  mfHoldings: MutualFundHolding[];
  ifHoldings: IndexFundHolding[];
  cashBalance: number;
  onBuyMutualFund: (fundId: string, amount: number, cashBalance: number) => Promise<{ success: boolean; units: number }>;
  onSellMutualFund: (fundId: string, units: number, cashBalance: number) => Promise<{ success: boolean }>;
  onBuyIndexFund: (fundId: string, amount: number, cashBalance: number) => Promise<{ success: boolean; units: number }>;
  onSellIndexFund: (fundId: string, units: number, cashBalance: number) => Promise<{ success: boolean }>;
  onRefreshPortfolio: () => void;
  onTrackMutualFundPurchase?: (categories: string[]) => void;
  onTrackIndexFundPurchase?: (totalOwned: number) => void;
}

type FundType = 'mutual' | 'index';
type TradeType = 'buy' | 'sell';

export function FundsSection({
  mutualFunds,
  indexFunds,
  mfHoldings,
  ifHoldings,
  cashBalance,
  onBuyMutualFund,
  onSellMutualFund,
  onBuyIndexFund,
  onSellIndexFund,
  onRefreshPortfolio,
  onTrackMutualFundPurchase,
  onTrackIndexFundPurchase,
}: FundsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedFund, setSelectedFund] = useState<MutualFund | IndexFund | null>(null);
  const [selectedFundType, setSelectedFundType] = useState<FundType>('mutual');
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [amount, setAmount] = useState<number>(1000);
  const [units, setUnits] = useState<number>(1);

  const showMutualFunds = mutualFunds.length > 0;
  const showIndexFunds = indexFunds.length > 0;

  const getMfHolding = (fundId: string) => mfHoldings.find(h => h.mutual_fund_id === fundId);
  const getIfHolding = (fundId: string) => ifHoldings.find(h => h.index_fund_id === fundId);

  const filteredMutualFunds = mutualFunds.filter(fund => {
    const matchesSearch = fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fund.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fund.amc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || fund.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredIndexFunds = indexFunds.filter(fund => {
    return fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           fund.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
           fund.tracking_index.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenTrade = (fund: MutualFund | IndexFund, type: FundType, trade: TradeType) => {
    setSelectedFund(fund);
    setSelectedFundType(type);
    setTradeType(trade);
    setAmount(1000);
    setUnits(1);
  };

  const handleTrade = async () => {
    if (!selectedFund) return;

    try {
      if (selectedFundType === 'mutual') {
        if (tradeType === 'buy') {
          const result = await onBuyMutualFund(selectedFund.id, amount, cashBalance);
          toast({
            title: "Investment Successful! 🎉",
            description: `Invested ₹${amount.toLocaleString('en-IN')} in ${selectedFund.name} (${result.units.toFixed(3)} units)`,
          });
          
          // Track mutual fund purchase for challenges
          if (onTrackMutualFundPurchase) {
            const fund = selectedFund as MutualFund;
            const existingCategories = mfHoldings.map(h => h.fund.category);
            const allCategories = [...existingCategories, fund.category];
            onTrackMutualFundPurchase(allCategories);
          }
        } else {
          await onSellMutualFund(selectedFund.id, units, cashBalance);
          toast({
            title: "Redemption Successful",
            description: `Redeemed ${units.toFixed(3)} units of ${selectedFund.name}`,
          });
        }
      } else {
        if (tradeType === 'buy') {
          const result = await onBuyIndexFund(selectedFund.id, amount, cashBalance);
          toast({
            title: "Investment Successful! 🎉",
            description: `Invested ₹${amount.toLocaleString('en-IN')} in ${selectedFund.name} (${result.units.toFixed(3)} units)`,
          });
          
          // Track index fund purchase for challenges
          if (onTrackIndexFundPurchase) {
            const existingFundIds = new Set(ifHoldings.map(h => h.index_fund_id));
            existingFundIds.add(selectedFund.id);
            onTrackIndexFundPurchase(existingFundIds.size);
          }
        } else {
          await onSellIndexFund(selectedFund.id, units, cashBalance);
          toast({
            title: "Redemption Successful",
            description: `Redeemed ${units.toFixed(3)} units of ${selectedFund.name}`,
          });
        }
      }
      onRefreshPortfolio();
      setSelectedFund(null);
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCurrentHolding = () => {
    if (!selectedFund) return null;
    if (selectedFundType === 'mutual') {
      return getMfHolding(selectedFund.id);
    }
    return getIfHolding(selectedFund.id);
  };

  const holding = getCurrentHolding();

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-transparent to-accent/5 px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {showMutualFunds ? 'Mutual Funds' : 'Index Funds'}
            </span>
            <span className="text-xs text-muted-foreground">
              • {showMutualFunds ? mutualFunds.length : indexFunds.length} funds
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Live NAV Updates
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={showMutualFunds ? "Search mutual funds..." : "Search index funds..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {showMutualFunds && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background border border-input rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="large_cap">Large Cap</option>
                  <option value="mid_cap">Mid Cap</option>
                  <option value="small_cap">Small Cap</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {showMutualFunds && (
            <>
              {['large_cap', 'mid_cap', 'small_cap'].map(category => {
                const fundsInCategory = filteredMutualFunds.filter(f => f.category === category);
                if (fundsInCategory.length === 0) return null;
                if (categoryFilter !== 'all' && categoryFilter !== category) return null;
                
                const categoryLabel = category === 'large_cap' ? 'Large Cap' : 
                                     category === 'mid_cap' ? 'Mid Cap' : 'Small Cap';
                const categoryIcon = category === 'large_cap' ? <Layers className="w-4 h-4" /> :
                                    category === 'mid_cap' ? <BarChart3 className="w-4 h-4" /> :
                                    <TrendingUp className="w-4 h-4" />;

                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        category === 'large_cap' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        category === 'mid_cap' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {categoryIcon}
                      </div>
                      <h3 className="font-semibold text-lg">{categoryLabel} Funds</h3>
                      <span className="text-xs text-muted-foreground">({fundsInCategory.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fundsInCategory.map(fund => {
                        const h = getMfHolding(fund.id);
                        return (
                          <FundCard
                            key={fund.id}
                            fund={fund}
                            type="mutual"
                            holding={h ? {
                              units: h.units,
                              currentValue: h.currentValue,
                              investedValue: h.average_nav * h.units,
                              profitLoss: h.profitLoss,
                              profitLossPercent: h.profitLossPercent,
                            } : undefined}
                            onBuy={() => handleOpenTrade(fund, 'mutual', 'buy')}
                            onSell={() => handleOpenTrade(fund, 'mutual', 'sell')}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {showIndexFunds && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Index Funds</h3>
                <span className="text-xs text-muted-foreground">({filteredIndexFunds.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIndexFunds.map(fund => {
                  const h = getIfHolding(fund.id);
                  return (
                    <FundCard
                      key={fund.id}
                      fund={fund}
                      type="index"
                      holding={h ? {
                        units: h.units,
                        currentValue: h.currentValue,
                        investedValue: h.average_nav * h.units,
                        profitLoss: h.profitLoss,
                        profitLossPercent: h.profitLossPercent,
                      } : undefined}
                      onBuy={() => handleOpenTrade(fund, 'index', 'buy')}
                      onSell={() => handleOpenTrade(fund, 'index', 'sell')}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade Dialog */}
      <Dialog open={!!selectedFund} onOpenChange={() => setSelectedFund(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tradeType === 'buy' ? 'Invest in' : 'Redeem from'} {selectedFund?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedFundType === 'mutual' ? 'Mutual Fund' : 'Index Fund'} • NAV: ₹{selectedFund?.nav.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>

          {selectedFund && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current NAV</span>
                  <span className="font-medium">₹{selectedFund.nav.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expense Ratio</span>
                  <span className="font-medium">{selectedFund.expense_ratio}%</span>
                </div>
                {tradeType === 'sell' && holding && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Units</span>
                    <span className="font-medium">{holding.units.toFixed(3)}</span>
                  </div>
                )}
              </div>

              {tradeType === 'buy' ? (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Investment Amount (₹)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={100}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(100, parseInt(e.target.value) || 100))}
                      className="flex-1"
                    />
                    <div className="flex gap-1">
                      {[1000, 5000, 10000].map(val => (
                        <Button
                          key={val}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(val)}
                          className="text-xs"
                        >
                          ₹{(val/1000)}K
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll get approximately {(amount / selectedFund.nav).toFixed(3)} units
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Units to Redeem</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnits(Math.max(0.001, units - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      step="0.001"
                      min={0.001}
                      max={holding?.units || 1}
                      value={units}
                      onChange={(e) => setUnits(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                      className="text-center w-24"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnits(Math.min(holding?.units || 1, units + 1))}
                    >
                      +
                    </Button>
                    {holding && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnits(holding.units)}
                        className="text-xs"
                      >
                        Max
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {tradeType === 'buy' ? 'Total Investment' : 'Estimated Redemption'}
                  </span>
                  <span className="font-bold text-lg">
                    ₹{tradeType === 'buy' 
                      ? amount.toLocaleString('en-IN') 
                      : (units * selectedFund.nav).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {tradeType === 'buy' && (
                  <p className="text-xs text-muted-foreground">
                    Available: ₹{cashBalance.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedFund(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              disabled={
                tradeType === 'buy'
                  ? amount > cashBalance || amount < 100
                  : !holding || units > holding.units
              }
            >
              Confirm {tradeType === 'buy' ? 'Investment' : 'Redemption'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
