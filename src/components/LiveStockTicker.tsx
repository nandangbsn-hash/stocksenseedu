import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Stock } from "@/hooks/useStockSimulation";
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

  // Get top movers
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  const currentStock = stocks[tickerIndex];
  const isPositive = currentStock?.changePercent >= 0;

  return (
    <div className="bg-gradient-to-r from-card via-card/80 to-card rounded-xl border border-border/50 p-3 mb-4 overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        {/* Live Ticker */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Live</span>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}>
            {currentStock && (
              <>
                <span className="font-bold text-foreground">{currentStock.symbol}</span>
                <span className="text-sm text-muted-foreground">₹{currentStock.current_price.toLocaleString('en-IN')}</span>
                <span className={cn(
                  "flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-lg",
                  isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{currentStock.changePercent.toFixed(2)}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top Movers */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Top Gainers:</span>
            {topGainers.map((stock, i) => (
              <span key={stock.id} className="text-success font-medium">
                {stock.symbol} +{stock.changePercent.toFixed(1)}%
                {i < topGainers.length - 1 && <span className="text-muted-foreground mx-1">•</span>}
              </span>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Top Losers:</span>
            {topLosers.map((stock, i) => (
              <span key={stock.id} className="text-destructive font-medium">
                {stock.symbol} {stock.changePercent.toFixed(1)}%
                {i < topLosers.length - 1 && <span className="text-muted-foreground mx-1">•</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
