import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  riskLevel: "Low" | "Medium" | "High";
}

interface StockCardProps {
  stock: Stock;
  onBuy: (stock: Stock) => void;
  onSell: (stock: Stock) => void;
  owned?: number;
}

const riskColors = {
  Low: "bg-success/10 text-success border-success/20",
  Medium: "bg-warning/10 text-warning-foreground border-warning/20",
  High: "bg-destructive/10 text-destructive border-destructive/20",
};

const riskTooltips = {
  Low: "Lower risk investments typically have steadier returns but may grow slower over time.",
  Medium: "Moderate risk with potential for good returns. May experience some ups and downs.",
  High: "Higher potential returns but also higher chance of losing value. Best for long-term horizons.",
};

export function StockCard({ stock, onBuy, onSell, owned = 0 }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-soft transition-all duration-300 hover:border-primary/30">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{stock.symbol}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${riskColors[stock.riskLevel]}`}>
                  {stock.riskLevel} Risk
                  <Info className="w-3 h-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{riskTooltips[stock.riskLevel]}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">{stock.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{stock.sector}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">₹{stock.price.toLocaleString()}</p>
          <div className={`flex items-center gap-1 justify-end ${isPositive ? "text-success" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {owned > 0 && (
        <div className="mb-4 p-2 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">You own</p>
          <p className="font-semibold text-primary">{owned} shares (₹{(owned * stock.price).toLocaleString()})</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="soft"
          size="sm"
          className="flex-1"
          onClick={() => onBuy(stock)}
        >
          Buy
        </Button>
        <Button
          variant="softSuccess"
          size="sm"
          className="flex-1"
          onClick={() => onSell(stock)}
          disabled={owned === 0}
        >
          Sell
        </Button>
      </div>
    </div>
  );
}
