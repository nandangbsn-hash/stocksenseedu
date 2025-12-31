import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PortfolioDashboardProps {
  balance: number;
  invested: number;
  currentValue: number;
  riskLevel: number; // 0-100
}

export function PortfolioDashboard({
  balance,
  invested,
  currentValue,
  riskLevel,
}: PortfolioDashboardProps) {
  const profitLoss = currentValue - invested;
  const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  const getRiskColor = (level: number) => {
    if (level < 30) return "text-success";
    if (level < 70) return "text-warning-foreground";
    return "text-destructive";
  };

  const getRiskLabel = (level: number) => {
    if (level < 30) return "Low Risk";
    if (level < 70) return "Medium Risk";
    return "High Risk";
  };

  const getRiskProgressColor = (level: number) => {
    if (level < 30) return "bg-success";
    if (level < 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground">Your Portfolio</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Demo Account</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Virtual Balance */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Available Cash</span>
          </div>
          <p className="font-bold text-xl text-foreground">₹{balance.toLocaleString()}</p>
        </div>

        {/* Invested */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Invested</span>
          </div>
          <p className="font-bold text-xl text-foreground">₹{invested.toLocaleString()}</p>
        </div>

        {/* Current Value */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Current Value</span>
          </div>
          <p className="font-bold text-xl text-foreground">₹{currentValue.toLocaleString()}</p>
        </div>

        {/* Profit/Loss */}
        <div className={`rounded-xl p-4 ${isProfit ? "bg-success/10" : "bg-destructive/10"}`}>
          <div className="flex items-center gap-2 mb-2">
            {isProfit ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">Profit/Loss</span>
          </div>
          <p className={`font-bold text-xl ${isProfit ? "text-success" : "text-destructive"}`}>
            {isProfit ? "+" : ""}₹{profitLoss.toLocaleString()}
          </p>
          <p className={`text-xs ${isProfit ? "text-success" : "text-destructive"}`}>
            ({isProfit ? "+" : ""}{profitLossPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Risk Meter */}
      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${getRiskColor(riskLevel)}`} />
            <span className="text-sm font-medium text-foreground">Portfolio Risk</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>This measures how concentrated your investments are. Lower risk means more diversification!</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className={`text-sm font-semibold ${getRiskColor(riskLevel)}`}>
            {getRiskLabel(riskLevel)}
          </span>
        </div>
        <div className="relative">
          <Progress value={riskLevel} className="h-3 bg-muted" />
          <div
            className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getRiskProgressColor(riskLevel)}`}
            style={{ width: `${riskLevel}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
