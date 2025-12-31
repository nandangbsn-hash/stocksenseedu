import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PortfolioDashboard } from "@/components/PortfolioDashboard";
import { StockCard, Stock } from "@/components/StockCard";
import { LearningPopup, PopupType } from "@/components/LearningPopup";
import { Button } from "@/components/ui/button";
import { Search, Filter, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

// Mock stock data
const mockStocks: Stock[] = [
  { id: "1", name: "Reliance Industries", symbol: "RELIANCE", sector: "Energy", price: 2456.75, change: 34.25, changePercent: 1.41, riskLevel: "Medium" },
  { id: "2", name: "Tata Consultancy Services", symbol: "TCS", sector: "IT Services", price: 3890.50, change: -12.30, changePercent: -0.32, riskLevel: "Low" },
  { id: "3", name: "HDFC Bank", symbol: "HDFCBANK", sector: "Banking", price: 1567.80, change: 22.45, changePercent: 1.45, riskLevel: "Low" },
  { id: "4", name: "Infosys", symbol: "INFY", sector: "IT Services", price: 1456.25, change: -8.50, changePercent: -0.58, riskLevel: "Low" },
  { id: "5", name: "Bharti Airtel", symbol: "BHARTIARTL", sector: "Telecom", price: 987.60, change: 15.40, changePercent: 1.58, riskLevel: "Medium" },
  { id: "6", name: "ICICI Bank", symbol: "ICICIBANK", sector: "Banking", price: 1023.45, change: 8.90, changePercent: 0.88, riskLevel: "Low" },
  { id: "7", name: "Adani Enterprises", symbol: "ADANIENT", sector: "Diversified", price: 2890.30, change: -45.60, changePercent: -1.55, riskLevel: "High" },
  { id: "8", name: "State Bank of India", symbol: "SBIN", sector: "Banking", price: 623.40, change: 5.20, changePercent: 0.84, riskLevel: "Medium" },
  { id: "9", name: "Wipro", symbol: "WIPRO", sector: "IT Services", price: 456.30, change: 2.10, changePercent: 0.46, riskLevel: "Low" },
  { id: "10", name: "Zomato", symbol: "ZOMATO", sector: "Consumer Tech", price: 187.50, change: 12.80, changePercent: 7.32, riskLevel: "High" },
];

const learningMessages = [
  {
    type: "warning" as PopupType,
    title: "Portfolio Concentration Alert",
    message: "You're putting more than 30% of your money in one stock. This increases your risk. Consider spreading your investments across different companies and sectors.",
    trigger: "concentration",
  },
  {
    type: "explanation" as PopupType,
    title: "Why Did This Stock Fall?",
    message: "Stock prices can fall due to many reasons: company news, sector trends, or broader economic factors like inflation or interest rate changes by RBI.",
    trigger: "negative",
  },
  {
    type: "longterm" as PopupType,
    title: "Long-Term Thinking",
    message: "Great investors don't panic during market falls. History shows that markets recover over time. Focus on learning, not short-term gains.",
    trigger: "sell",
  },
];

export default function Simulator() {
  const [balance, setBalance] = useState(100000);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activePopup, setActivePopup] = useState<typeof learningMessages[0] | null>(null);

  const invested = Object.entries(portfolio).reduce((sum, [stockId, quantity]) => {
    const stock = mockStocks.find((s) => s.id === stockId);
    return sum + (stock ? stock.price * quantity : 0);
  }, 0);

  const currentValue = invested; // In real app, this would track value changes

  const calculateRiskLevel = () => {
    if (Object.keys(portfolio).length === 0) return 20;
    const totalShares = Object.values(portfolio).reduce((a, b) => a + b, 0);
    const maxConcentration = Math.max(...Object.values(portfolio)) / totalShares;
    const highRiskStocks = Object.entries(portfolio).filter(([id]) => {
      const stock = mockStocks.find((s) => s.id === id);
      return stock?.riskLevel === "High";
    }).length;
    return Math.min(100, Math.round((maxConcentration * 50) + (highRiskStocks * 20)));
  };

  const handleBuy = (stock: Stock) => {
    const buyAmount = stock.price;
    if (balance < buyAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough virtual money for this purchase.",
        variant: "destructive",
      });
      return;
    }

    setBalance((prev) => prev - buyAmount);
    setPortfolio((prev) => ({
      ...prev,
      [stock.id]: (prev[stock.id] || 0) + 1,
    }));

    toast({
      title: "Stock Purchased! 🎉",
      description: `You bought 1 share of ${stock.symbol} for ₹${stock.price.toLocaleString()}`,
    });

    // Trigger learning popup based on action
    const currentHolding = (portfolio[stock.id] || 0) + 1;
    const totalInStock = currentHolding * stock.price;
    if (totalInStock / (invested + buyAmount) > 0.3) {
      setActivePopup(learningMessages.find((m) => m.trigger === "concentration") || null);
    }
  };

  const handleSell = (stock: Stock) => {
    if (!portfolio[stock.id] || portfolio[stock.id] === 0) {
      toast({
        title: "No Shares to Sell",
        description: "You don't own any shares of this stock.",
        variant: "destructive",
      });
      return;
    }

    setBalance((prev) => prev + stock.price);
    setPortfolio((prev) => ({
      ...prev,
      [stock.id]: prev[stock.id] - 1,
    }));

    toast({
      title: "Stock Sold",
      description: `You sold 1 share of ${stock.symbol} for ₹${stock.price.toLocaleString()}`,
    });

    // Trigger long-term thinking popup
    if (stock.change < 0) {
      setActivePopup(learningMessages.find((m) => m.trigger === "sell") || null);
    }
  };

  const filteredStocks = mockStocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Stock Simulator
            </h1>
            <p className="text-muted-foreground">
              Practice investing with virtual money. Learn from every decision.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio Dashboard */}
              <PortfolioDashboard
                balance={balance}
                invested={invested}
                currentValue={currentValue}
                riskLevel={calculateRiskLevel()}
              />

              {/* Learning Popup */}
              {activePopup && (
                <LearningPopup
                  type={activePopup.type}
                  title={activePopup.title}
                  message={activePopup.message}
                  onClose={() => setActivePopup(null)}
                />
              )}

              {/* Stock List */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Available Stocks
                  </h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stocks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-full sm:w-64"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStocks.map((stock) => (
                    <StockCard
                      key={stock.id}
                      stock={stock}
                      onBuy={handleBuy}
                      onSell={handleSell}
                      owned={portfolio[stock.id] || 0}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Learning Tips */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground">Quick Tips</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Diversify across different sectors",
                    "Don't invest all your money at once",
                    "High risk doesn't always mean high returns",
                    "Focus on learning, not quick profits",
                    "Track your decisions and learn from them",
                  ].map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Remember:</strong> This is a learning simulator using virtual money. 
                  Real stock markets involve actual financial risk. Always consult a financial advisor before making real investments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
