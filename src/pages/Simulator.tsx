import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStockSimulation, Stock, Holding } from "@/hooks/useStockSimulation";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Lightbulb, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  PieChart,
  BarChart3,
  AlertTriangle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LearningPopup, PopupType } from "@/components/LearningPopup";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PortfolioChart } from "@/components/PortfolioChart";

// Learning messages for smart feedback
const learningMessages = [
  {
    type: "warning" as PopupType,
    title: "Portfolio Concentration Alert",
    message: "You're putting more than 30% of your money in one stock. This increases your risk. Consider spreading your investments across different companies and sectors.",
    trigger: "concentration",
  },
  {
    type: "tip" as PopupType,
    title: "Consider SIP Investing",
    message: "Instead of investing large amounts at once, try investing smaller amounts regularly. This is called SIP (Systematic Investment Plan) and helps average out your buying price.",
    trigger: "large_buy",
  },
  {
    type: "longterm" as PopupType,
    title: "Long-Term Thinking",
    message: "Great investors don't panic during market falls. History shows that markets recover over time. Focus on learning, not short-term gains.",
    trigger: "sell_loss",
  },
  {
    type: "explanation" as PopupType,
    title: "Why Did This Stock Fall?",
    message: "Stock prices can fall due to many reasons: company news, sector trends, or broader economic factors like inflation or interest rate changes by RBI.",
    trigger: "negative_stock",
  },
];

export default function Simulator() {
  const { user } = useAuth();
  const { stocks, portfolio, holdings, metrics, simulatedYear, portfolioHistory, loading, buyStock, sellStock } = useStockSimulation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [activePopup, setActivePopup] = useState<typeof learningMessages[0] | null>(null);
  const [showHoldings, setShowHoldings] = useState(true);

  const sectors = [...new Set(stocks.map(s => s.sector))];

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === 'all' || stock.sector === sectorFilter;
    return matchesSearch && matchesSector;
  });

  const handleTrade = async () => {
    if (!selectedStock || !user) return;

    try {
      if (tradeType === 'buy') {
        const totalCost = selectedStock.current_price * quantity;
        
        // Check for concentration
        const existingHolding = holdings.find(h => h.stock_id === selectedStock.id);
        const newValue = (existingHolding?.currentValue || 0) + totalCost;
        if (newValue / (metrics.totalValue + totalCost) > 0.3) {
          setActivePopup(learningMessages.find(m => m.trigger === 'concentration') || null);
        }

        // Check for large buy
        if (totalCost > metrics.cashBalance * 0.5) {
          setTimeout(() => {
            setActivePopup(learningMessages.find(m => m.trigger === 'large_buy') || null);
          }, 500);
        }

        await buyStock(selectedStock.id, quantity);
        toast({
          title: "Stock Purchased! 🎉",
          description: `Bought ${quantity} share(s) of ${selectedStock.symbol} for ₹${totalCost.toLocaleString('en-IN')}`,
        });
      } else {
        const holding = holdings.find(h => h.stock_id === selectedStock.id);
        if (holding && holding.profitLoss < 0) {
          setActivePopup(learningMessages.find(m => m.trigger === 'sell_loss') || null);
        }

        await sellStock(selectedStock.id, quantity);
        toast({
          title: "Stock Sold",
          description: `Sold ${quantity} share(s) of ${selectedStock.symbol}`,
        });
      }
      setSelectedStock(null);
      setQuantity(1);
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getHolding = (stockId: string) => holdings.find(h => h.stock_id === stockId);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 py-20 text-center">
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="font-display text-3xl font-bold mb-4">Start Your Investing Journey</h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Sign up to receive ₹1,00,000 in virtual money and practice investing without any risk.
            </p>
            <Link to="/auth">
              <Button size="lg">Create Free Account</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="animate-pulse space-y-6">
              <div className="h-40 bg-muted rounded-2xl" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Stock Simulator
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Educational simulation using delayed market data
                </p>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-bold text-lg">Year {simulatedYear}</span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>1 day = 1 year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Popup */}
          {activePopup && (
            <div className="mb-6">
              <LearningPopup
                type={activePopup.type}
                title={activePopup.title}
                message={activePopup.message}
                onClose={() => setActivePopup(null)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Portfolio */}
            <div className="xl:col-span-1 space-y-4">
              {/* Portfolio Summary Card */}
              <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
                <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Portfolio
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{metrics.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="font-semibold">
                        ₹{metrics.investedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Cash</p>
                      <p className="font-semibold">
                        ₹{metrics.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className={`rounded-lg p-3 ${metrics.unrealizedPL >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                    <p className={`font-semibold flex items-center gap-1 ${
                      metrics.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {metrics.unrealizedPL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {metrics.unrealizedPL >= 0 ? '+' : ''}₹{metrics.unrealizedPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      <span className="text-sm">
                        ({metrics.unrealizedPLPercent >= 0 ? '+' : ''}{metrics.unrealizedPLPercent.toFixed(2)}%)
                      </span>
                    </p>
                  </div>

                  {/* Risk Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Risk Score
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Based on portfolio concentration and high-risk stock exposure</p>
                          </TooltipContent>
                        </Tooltip>
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        metrics.riskScore < 40 ? 'bg-success/10 text-success' :
                        metrics.riskScore < 60 ? 'bg-warning/10 text-warning-foreground' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {metrics.riskScore < 40 ? 'Low' : metrics.riskScore < 60 ? 'Medium' : 'High'}
                      </span>
                    </div>
                    <Progress value={metrics.riskScore} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Holdings */}
              <div className="bg-card rounded-2xl border border-border shadow-soft">
                <button 
                  className="w-full p-4 flex items-center justify-between"
                  onClick={() => setShowHoldings(!showHoldings)}
                >
                  <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Your Holdings ({holdings.length})
                  </h3>
                  {showHoldings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHoldings && (
                  <div className="px-4 pb-4 space-y-2">
                    {holdings.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No holdings yet. Start investing!
                      </p>
                    ) : (
                      holdings.map(holding => (
                        <div key={holding.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{holding.stock.symbol}</span>
                            <span className="text-xs text-muted-foreground">{holding.quantity} shares</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              ₹{holding.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                            <span className={`text-xs font-medium ${
                              holding.profitLoss >= 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Portfolio Chart */}
              <PortfolioChart 
                history={portfolioHistory}
                currentYear={simulatedYear}
                startingBalance={100000}
              />

              {/* Tips */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Quick Tips</h3>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    Time moves fast! 1 real day = 1 simulated year
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    Diversify across different sectors
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    Focus on learning, not quick profits
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Stock List */}
            <div className="xl:col-span-3">
              <div className="bg-card rounded-2xl border border-border shadow-soft">
                {/* Search and Filter */}
                <div className="p-4 border-b border-border">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="bg-background border border-input rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="all">All Sectors</option>
                        {sectors.map(sector => (
                          <option key={sector} value={sector}>{sector}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Stock Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="p-3 font-medium">Stock</th>
                        <th className="p-3 font-medium">Sector</th>
                        <th className="p-3 font-medium text-right">Price</th>
                        <th className="p-3 font-medium text-right">Change</th>
                        <th className="p-3 font-medium text-center">Risk</th>
                        <th className="p-3 font-medium text-center">Holding</th>
                        <th className="p-3 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredStocks.map(stock => {
                        const holding = getHolding(stock.id);
                        
                        return (
                          <tr key={stock.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div>
                                <p className="font-semibold text-foreground">{stock.symbol}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{stock.name}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="text-xs bg-muted px-2 py-1 rounded">{stock.sector}</span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              ₹{stock.current_price.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`flex items-center justify-end gap-1 text-sm ${
                                stock.changePercent >= 0 ? 'text-success' : 'text-destructive'
                              }`}>
                                {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded ${
                                stock.risk_level === 'Low' ? 'bg-success/10 text-success' :
                                stock.risk_level === 'Medium' ? 'bg-warning/10 text-warning-foreground' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                {stock.risk_level}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {holding ? (
                                <span className="text-sm font-medium">{holding.quantity}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setSelectedStock(stock);
                                    setTradeType('buy');
                                    setQuantity(1);
                                  }}
                                >
                                  Buy
                                </Button>
                                {holding && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setTradeType('sell');
                                      setQuantity(1);
                                    }}
                                  >
                                    Sell
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredStocks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No stocks found matching your search.
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-4 bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Educational Disclaimer:</strong> This is a learning simulator using delayed market data. 
                  Real stock markets involve actual financial risk. Always consult a financial advisor before making real investments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Trade Dialog */}
      <Dialog open={!!selectedStock} onOpenChange={() => setSelectedStock(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedStock?.symbol}
            </DialogTitle>
            <DialogDescription>
              {selectedStock?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedStock && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Price</span>
                  <span className="font-medium">₹{selectedStock.current_price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className={`font-medium ${
                    selectedStock.risk_level === 'Low' ? 'text-success' :
                    selectedStock.risk_level === 'Medium' ? 'text-warning-foreground' :
                    'text-destructive'
                  }`}>{selectedStock.risk_level}</span>
                </div>
                {tradeType === 'sell' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">You Own</span>
                    <span className="font-medium">{getHolding(selectedStock.id)?.quantity || 0} shares</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={tradeType === 'sell' ? (getHolding(selectedStock.id)?.quantity || 1) : 1000}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total {tradeType === 'buy' ? 'Cost' : 'Proceeds'}</span>
                  <span className="font-bold text-lg">
                    ₹{(selectedStock.current_price * quantity).toLocaleString('en-IN')}
                  </span>
                </div>
                {tradeType === 'buy' && (
                  <p className="text-xs text-muted-foreground">
                    Available: ₹{metrics.cashBalance.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedStock(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleTrade}
              variant={tradeType === 'buy' ? 'default' : 'outline'}
              disabled={
                tradeType === 'buy' 
                  ? (selectedStock ? selectedStock.current_price * quantity > metrics.cashBalance : true)
                  : (selectedStock ? quantity > (getHolding(selectedStock.id)?.quantity || 0) : true)
              }
            >
              Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
