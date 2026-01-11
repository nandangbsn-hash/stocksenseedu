import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Stock } from "@/contexts/SimulationContext";
import { cn } from "@/lib/utils";

interface LiveStockTickerProps {
  stocks: Stock[];
}

export function LiveStockTicker({ stocks }: LiveStockTickerProps) {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotate through stocks every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % Math.max(1, stocks.length));
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [stocks.length]);

  if (stocks.length === 0) return null;

  // Get top movers (just 2 each for compact view)
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 2);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 2);

  const currentStock = stocks[tickerIndex];
  const isPositive = currentStock?.changePercent >= 0;

  return (
    <div className="bg-card/80 rounded-lg border border-border/50 px-3 py-2 mb-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        {/* Live Ticker */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded">
            <Zap className="w-3 h-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase">Live</span>
          </div>
          
          <div className={cn(
            "flex items-center gap-1.5 transition-all duration-300",
            isAnimating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          )}>
            {currentStock && (
              <>
                <span className="font-semibold text-sm text-foreground">{currentStock.symbol}</span>
                <span className="text-xs text-muted-foreground">₹{currentStock.current_price.toLocaleString('en-IN')}</span>
                <span className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
                  isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isPositive ? '+' : ''}{currentStock.changePercent.toFixed(1)}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top Movers - Compact */}
        <div className="hidden lg:flex items-center gap-2 text-[11px]">
          <TrendingUp className="w-3 h-3 text-success" />
          {topGainers.map((stock, i) => (
            <span key={stock.id} className="text-success font-medium">
              {stock.symbol} +{stock.changePercent.toFixed(0)}%{i < topGainers.length - 1 && ","}
            </span>
          ))}
          <span className="text-muted-foreground mx-1">|</span>
          <TrendingDown className="w-3 h-3 text-destructive" />
          {topLosers.map((stock, i) => (
            <span key={stock.id} className="text-destructive font-medium">
              {stock.symbol} {stock.changePercent.toFixed(0)}%{i < topLosers.length - 1 && ","}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
