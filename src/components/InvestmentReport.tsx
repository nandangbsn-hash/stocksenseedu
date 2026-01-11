import { TrendingUp, TrendingDown, Award, Target, BarChart3, PieChart, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Holding, PortfolioHistoryPoint } from "@/contexts/SimulationContext";

interface InvestmentReportProps {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
  finalYear: number;
  totalValue: number;
  startingBalance: number;
  holdings: Holding[];
  portfolioHistory: PortfolioHistoryPoint[];
  cashBalance: number;
}

export function InvestmentReport({
  open,
  onClose,
  onRestart,
  finalYear,
  totalValue,
  startingBalance,
  holdings,
  portfolioHistory,
  cashBalance,
}: InvestmentReportProps) {
  const totalReturn = totalValue - startingBalance;
  const totalReturnPercent = ((totalValue - startingBalance) / startingBalance) * 100;
  const cagr = ((Math.pow(totalValue / startingBalance, 1 / finalYear) - 1) * 100).toFixed(2);
  
  // Calculate best and worst performers
  const sortedHoldings = [...holdings].sort((a, b) => b.profitLossPercent - a.profitLossPercent);
  const bestPerformer = sortedHoldings[0];
  const worstPerformer = sortedHoldings[sortedHoldings.length - 1];
  
  // Calculate sector distribution
  const sectorDistribution = holdings.reduce((acc, h) => {
    const sector = h.stock.sector;
    acc[sector] = (acc[sector] || 0) + h.currentValue;
    return acc;
  }, {} as Record<string, number>);
  
  const investedValue = holdings.reduce((sum, h) => sum + h.average_buy_price * h.quantity, 0);
  
  // Determine investor grade
  const getInvestorGrade = () => {
    if (totalReturnPercent >= 200) return { grade: 'A+', title: 'Legendary Investor', emoji: '🏆', color: 'text-yellow-500' };
    if (totalReturnPercent >= 100) return { grade: 'A', title: 'Master Investor', emoji: '⭐', color: 'text-success' };
    if (totalReturnPercent >= 50) return { grade: 'B+', title: 'Skilled Investor', emoji: '📈', color: 'text-primary' };
    if (totalReturnPercent >= 20) return { grade: 'B', title: 'Growing Investor', emoji: '🌱', color: 'text-info' };
    if (totalReturnPercent >= 0) return { grade: 'C', title: 'Cautious Investor', emoji: '📊', color: 'text-muted-foreground' };
    if (totalReturnPercent >= -20) return { grade: 'D', title: 'Learning Investor', emoji: '📚', color: 'text-warning-foreground' };
    return { grade: 'F', title: 'Keep Learning!', emoji: '💪', color: 'text-destructive' };
  };
  
  const grade = getInvestorGrade();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 flex items-center justify-center animate-pulse-soft">
              <span className="text-4xl">{grade.emoji}</span>
            </div>
          </div>
          <DialogTitle className="font-display text-3xl">
            <span className="bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              {finalYear} Year Journey Complete!
            </span>
          </DialogTitle>
          <DialogDescription className="text-lg">
            Your Investment Report Card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grade Section */}
          <div className="bg-gradient-to-br from-card to-muted/50 rounded-2xl p-6 text-center border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2 font-medium tracking-wide uppercase">Your Grade</p>
            <div className="flex items-center justify-center gap-4">
              <span className={`text-7xl font-black font-display ${grade.color}`}>{grade.grade}</span>
              <div className="text-left">
                <p className="font-bold text-xl">{grade.title}</p>
                <p className="text-sm text-muted-foreground">Based on your {finalYear}-year performance</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-4 border border-success/20">
              <p className="text-xs text-muted-foreground mb-1">Final Portfolio Value</p>
              <p className="text-2xl font-bold text-success">
                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={`rounded-xl p-4 border ${totalReturn >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
              <p className="text-xs text-muted-foreground mb-1">Total Return</p>
              <div className="flex items-center gap-2">
                {totalReturn >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalReturn >= 0 ? '+' : ''}₹{Math.abs(totalReturn).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <p className={`text-sm font-medium ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                ({totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* CAGR and Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-4 border text-center">
              <BarChart3 className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">CAGR</p>
              <p className="text-lg font-bold text-primary">{cagr}%</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <PieChart className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Stocks Owned</p>
              <p className="text-lg font-bold">{holdings.length}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border text-center">
              <Target className="w-5 h-5 text-info mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Sectors</p>
              <p className="text-lg font-bold">{Object.keys(sectorDistribution).length}</p>
            </div>
          </div>

          {/* Best & Worst Performers */}
          {holdings.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {bestPerformer && (
                <div className="bg-success/5 rounded-xl p-4 border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-success" />
                    <span className="text-xs font-medium text-success">Best Performer</span>
                  </div>
                  <p className="font-bold text-lg">{bestPerformer.stock.symbol}</p>
                  <p className="text-sm text-success font-semibold">
                    +{bestPerformer.profitLossPercent.toFixed(2)}%
                  </p>
                </div>
              )}
              {worstPerformer && holdings.length > 1 && (
                <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Worst Performer</span>
                  </div>
                  <p className="font-bold text-lg">{worstPerformer.stock.symbol}</p>
                  <p className="text-sm text-destructive font-semibold">
                    {worstPerformer.profitLossPercent.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-xl p-5 border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Investment Insights</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {totalReturnPercent > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  You grew your money by staying invested over {finalYear} years!
                </li>
              )}
              {holdings.length >= 5 && (
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  Good diversification with {holdings.length} different stocks.
                </li>
              )}
              {holdings.length < 3 && (
                <li className="flex items-start gap-2">
                  <span className="text-warning-foreground">!</span>
                  Try diversifying more next time - don't put all eggs in one basket.
                </li>
              )}
              {cashBalance > totalValue * 0.5 && (
                <li className="flex items-start gap-2">
                  <span className="text-info">💡</span>
                  You kept a lot in cash. Investing more could have grown your wealth faster.
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-primary">📊</span>
                The key to wealth is consistency, patience, and continuous learning!
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={onRestart} 
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" />
              Start New Journey
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Keep Viewing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
