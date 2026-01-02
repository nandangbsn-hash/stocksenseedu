import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface YearCountdownTimerProps {
  yearStartedAt: string;
  currentYear: number;
  maxYears: number;
}

export function YearCountdownTimer({ yearStartedAt, currentYear, maxYears }: YearCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const startDate = new Date(yearStartedAt);
      const now = new Date();
      const YEAR_DURATION = 24 * 60 * 60 * 1000; // 1 day = 1 year
      
      // Calculate when the next year starts
      const elapsed = now.getTime() - startDate.getTime();
      const currentYearNumber = Math.floor(elapsed / YEAR_DURATION);
      const nextYearStart = new Date(startDate.getTime() + ((currentYearNumber + 1) * YEAR_DURATION));
      
      const remaining = nextYearStart.getTime() - now.getTime();
      
      if (remaining <= 0 || currentYear >= maxYears) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [yearStartedAt, currentYear, maxYears]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (currentYear >= maxYears) {
    return (
      <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl px-4 py-2">
        <Calendar className="w-4 h-4 text-success" />
        <span className="text-sm font-medium text-success">Simulation Complete!</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Next Year in</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-background/80 rounded-lg px-2 py-1 min-w-[36px] text-center">
            <span className="font-mono font-bold text-sm text-foreground">{formatNumber(timeRemaining.hours)}</span>
            <span className="text-[8px] text-muted-foreground block -mt-0.5">HRS</span>
          </div>
          <span className="text-primary font-bold">:</span>
          <div className="bg-background/80 rounded-lg px-2 py-1 min-w-[36px] text-center">
            <span className="font-mono font-bold text-sm text-foreground">{formatNumber(timeRemaining.minutes)}</span>
            <span className="text-[8px] text-muted-foreground block -mt-0.5">MIN</span>
          </div>
          <span className="text-primary font-bold">:</span>
          <div className="bg-background/80 rounded-lg px-2 py-1 min-w-[36px] text-center">
            <span className="font-mono font-bold text-sm text-foreground animate-pulse">{formatNumber(timeRemaining.seconds)}</span>
            <span className="text-[8px] text-muted-foreground block -mt-0.5">SEC</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          → Year {currentYear + 1}
        </div>
      </div>
    </div>
  );
}
