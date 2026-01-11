import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stock, Holding } from "@/contexts/SimulationContext";
import { cn } from "@/lib/utils";

interface StockRowProps {
  stock: Stock;
  holding?: Holding;
  onBuy: (stock: Stock) => void;
  onSell: (stock: Stock) => void;
}

export function StockRow({ stock, holding, onBuy, onSell }: StockRowProps) {
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [showSparkle, setShowSparkle] = useState(false);
  const prevPriceRef = useRef(stock.current_price);
  const prevChangeRef = useRef(stock.changePercent);

  useEffect(() => {
    const prevPrice = prevPriceRef.current;
    const currentPrice = stock.current_price;

    if (prevPrice !== currentPrice) {
      const direction = currentPrice > prevPrice ? 'up' : 'down';
      setPriceAnimation(direction);
      
      // Show sparkle for significant changes (>2%)
      if (Math.abs(stock.changePercent - prevChangeRef.current) > 2) {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1500);
      }

      // Clear animation after it plays
      setTimeout(() => setPriceAnimation(null), 800);
    }

    prevPriceRef.current = currentPrice;
    prevChangeRef.current = stock.changePercent;
  }, [stock.current_price, stock.changePercent]);

  const isPositive = stock.changePercent >= 0;

  return (
    <tr 
      className={cn(
        "transition-all duration-300 hover:bg-muted/40 group",
        priceAnimation === 'up' && "animate-flash-green",
        priceAnimation === 'down' && "animate-flash-red"
      )}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300",
              isPositive 
                ? "bg-gradient-to-br from-success/20 to-success/10 text-success" 
                : "bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive"
            )}>
              {stock.symbol.slice(0, 2)}
            </div>
            {showSparkle && (
              <Sparkles className={cn(
                "w-3 h-3 absolute -top-1 -right-1 animate-bounce-subtle",
                isPositive ? "text-success" : "text-destructive"
              )} />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {stock.symbol}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {stock.name}
            </p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className="text-xs bg-muted/80 px-2.5 py-1.5 rounded-lg font-medium">
          {stock.sector}
        </span>
      </td>
      <td className="p-3 text-right">
        <div className={cn(
          "inline-flex items-center gap-1 font-bold text-base transition-all duration-300 rounded-lg px-2 py-1",
          priceAnimation === 'up' && "animate-price-up",
          priceAnimation === 'down' && "animate-price-down"
        )}>
          <span>₹{stock.current_price.toLocaleString('en-IN')}</span>
          {priceAnimation && (
            <span className={cn(
              "transition-opacity duration-300",
              priceAnimation === 'up' ? "text-success" : "text-destructive"
            )}>
              {priceAnimation === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            </span>
          )}
        </div>
      </td>
      <td className="p-3 text-right">
        <div className={cn(
          "inline-flex items-center justify-end gap-1.5 text-sm font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-300",
          isPositive 
            ? "text-success bg-success/10" 
            : "text-destructive bg-destructive/10",
          Math.abs(stock.changePercent) > 5 && isPositive && "animate-glow-success",
          Math.abs(stock.changePercent) > 5 && !isPositive && "animate-glow-danger"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </div>
      </td>
      <td className="p-3 text-center">
        <span className={cn(
          "text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-300",
          stock.risk_level === 'Low' && 'bg-success/15 text-success border border-success/20',
          stock.risk_level === 'Medium' && 'bg-warning/15 text-warning-foreground border border-warning/20',
          stock.risk_level === 'High' && 'bg-destructive/15 text-destructive border border-destructive/20'
        )}>
          {stock.risk_level}
        </span>
      </td>
      <td className="p-3 text-center">
        {holding ? (
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
            <span className="text-sm font-bold">{holding.quantity}</span>
            <span className="text-xs opacity-70">shares</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="sm"
            variant="default"
            className="h-8 px-4 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
            onClick={() => onBuy(stock)}
          >
            Buy
          </Button>
          {holding && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-4 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200 hover:scale-105"
              onClick={() => onSell(stock)}
            >
              Sell
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}