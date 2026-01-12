import { TrendingUp, TrendingDown, Building2, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MutualFund, IndexFund } from "@/contexts/SimulationContext";

interface FundCardProps {
  fund: MutualFund | IndexFund;
  type: 'mutual' | 'index';
  holding?: {
    units: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
  };
  onBuy: () => void;
  onSell: () => void;
}

export function FundCard({ fund, type, holding, onBuy, onSell }: FundCardProps) {
  const isMutualFund = type === 'mutual';
  const mutualFund = fund as MutualFund;
  const indexFund = fund as IndexFund;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'large_cap': return 'Large Cap';
      case 'mid_cap': return 'Mid Cap';
      case 'small_cap': return 'Small Cap';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'large_cap': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'mid_cap': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'small_cap': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
      case 'Moderate': return 'text-success';
      case 'High': return 'text-warning-foreground';
      case 'Very High': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{fund.name}</h3>
            {isMutualFund && (
              <Badge variant="outline" className={`text-[10px] ${getCategoryColor(mutualFund.category)}`}>
                {getCategoryLabel(mutualFund.category)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {fund.amc}
            </span>
            {!isMutualFund && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {indexFund.tracking_index}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">₹{fund.nav.toLocaleString('en-IN')}</p>
          <div className={`flex items-center justify-end gap-1 text-xs ${
            fund.changePercent >= 0 ? 'text-success' : 'text-destructive'
          }`}>
            {fund.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {fund.changePercent >= 0 ? '+' : ''}{fund.changePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-muted-foreground">1Y Return</p>
          <p className={`font-semibold ${fund.one_year_return >= 0 ? 'text-success' : 'text-destructive'}`}>
            {fund.one_year_return >= 0 ? '+' : ''}{fund.one_year_return}%
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-muted-foreground">3Y Return</p>
          <p className={`font-semibold ${fund.three_year_return >= 0 ? 'text-success' : 'text-destructive'}`}>
            {fund.three_year_return >= 0 ? '+' : ''}{fund.three_year_return}%
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center">
          <p className="text-muted-foreground">{isMutualFund ? 'Risk' : 'TER'}</p>
          <p className={`font-semibold ${isMutualFund ? getRiskColor(mutualFund.risk_level) : 'text-foreground'}`}>
            {isMutualFund ? mutualFund.risk_level : `${indexFund.expense_ratio}%`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>Expense Ratio: {fund.expense_ratio}%</span>
        {fund.aum && <span>AUM: {fund.aum}</span>}
      </div>

      {holding && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3 mb-3 border border-primary/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Your Investment</span>
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              holding.profitLoss >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {holding.profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(1)}%
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{holding.units.toFixed(3)} units</span>
            <span className="font-bold">₹{holding.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onBuy}>
          Invest
        </Button>
        {holding && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onSell}>
            Redeem
          </Button>
        )}
      </div>
    </div>
  );
}
