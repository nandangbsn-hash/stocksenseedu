import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface PortfolioChartProps {
  history: Array<{
    year: number;
    totalValue: number;
    invested: number;
  }>;
  currentYear: number;
  startingBalance: number;
}

export function PortfolioChart({ history, currentYear, startingBalance }: PortfolioChartProps) {
  // Generate chart data with initial point
  const chartData = useMemo(() => {
    const data = [
      { year: 1, totalValue: startingBalance, invested: 0, label: 'Year 1' },
    ];
    
    history.forEach(point => {
      if (point.year > 1) {
        data.push({
          year: point.year,
          totalValue: Math.round(point.totalValue),
          invested: Math.round(point.invested),
          label: `Year ${point.year}`,
        });
      } else if (point.year === 1) {
        data[0] = {
          year: 1,
          totalValue: Math.round(point.totalValue),
          invested: Math.round(point.invested),
          label: 'Year 1',
        };
      }
    });
    
    return data;
  }, [history, startingBalance]);

  const formatValue = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  if (chartData.length <= 1) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Portfolio Growth</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          <p>Chart will show your portfolio growth over time.<br />Keep investing to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Portfolio Growth</h3>
        </div>
        <span className="text-xs text-muted-foreground">Year {currentYear} of your journey</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="label" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickFormatter={formatValue}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString('en-IN')}`,
                name === 'totalValue' ? 'Total Value' : 'Invested'
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => value === 'totalValue' ? 'Total Value' : 'Amount Invested'}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorInvested)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Starting</p>
          <p className="font-semibold text-sm">₹{startingBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="font-semibold text-sm">
            ₹{chartData[chartData.length - 1]?.totalValue.toLocaleString('en-IN') || startingBalance.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={`rounded-lg p-2 ${
          (chartData[chartData.length - 1]?.totalValue || startingBalance) >= startingBalance 
            ? 'bg-success/10' 
            : 'bg-destructive/10'
        }`}>
          <p className="text-xs text-muted-foreground">Growth</p>
          <p className={`font-semibold text-sm ${
            (chartData[chartData.length - 1]?.totalValue || startingBalance) >= startingBalance 
              ? 'text-success' 
              : 'text-destructive'
          }`}>
            {((((chartData[chartData.length - 1]?.totalValue || startingBalance) - startingBalance) / startingBalance) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
