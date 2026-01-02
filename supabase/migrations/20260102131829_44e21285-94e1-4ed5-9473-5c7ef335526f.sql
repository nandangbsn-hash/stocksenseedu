-- Create mutual_funds table
CREATE TABLE public.mutual_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'large_cap', 'mid_cap', 'small_cap'
  amc TEXT NOT NULL, -- Asset Management Company
  nav NUMERIC NOT NULL, -- Net Asset Value (current price per unit)
  base_nav NUMERIC NOT NULL, -- Base NAV for price reset
  expense_ratio NUMERIC DEFAULT 1.5,
  risk_level TEXT DEFAULT 'Medium',
  one_year_return NUMERIC DEFAULT 0,
  three_year_return NUMERIC DEFAULT 0,
  five_year_return NUMERIC DEFAULT 0,
  aum TEXT, -- Assets Under Management
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index_funds table
CREATE TABLE public.index_funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL UNIQUE,
  tracking_index TEXT NOT NULL, -- e.g., 'Nifty 50', 'Sensex'
  amc TEXT NOT NULL,
  nav NUMERIC NOT NULL,
  base_nav NUMERIC NOT NULL,
  expense_ratio NUMERIC DEFAULT 0.2,
  tracking_error NUMERIC DEFAULT 0.1,
  one_year_return NUMERIC DEFAULT 0,
  three_year_return NUMERIC DEFAULT 0,
  five_year_return NUMERIC DEFAULT 0,
  aum TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mutual_fund_holdings table
CREATE TABLE public.mutual_fund_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  mutual_fund_id UUID NOT NULL REFERENCES public.mutual_funds(id) ON DELETE CASCADE,
  units NUMERIC NOT NULL,
  average_nav NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(portfolio_id, mutual_fund_id)
);

-- Create index_fund_holdings table
CREATE TABLE public.index_fund_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  index_fund_id UUID NOT NULL REFERENCES public.index_funds(id) ON DELETE CASCADE,
  units NUMERIC NOT NULL,
  average_nav NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(portfolio_id, index_fund_id)
);

-- Enable RLS
ALTER TABLE public.mutual_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.index_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutual_fund_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.index_fund_holdings ENABLE ROW LEVEL SECURITY;

-- RLS policies for mutual_funds (viewable by everyone)
CREATE POLICY "Mutual funds are viewable by everyone"
ON public.mutual_funds FOR SELECT USING (true);

-- RLS policies for index_funds (viewable by everyone)
CREATE POLICY "Index funds are viewable by everyone"
ON public.index_funds FOR SELECT USING (true);

-- RLS policies for mutual_fund_holdings
CREATE POLICY "Users can view own mutual fund holdings"
ON public.mutual_fund_holdings FOR SELECT
USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = mutual_fund_holdings.portfolio_id AND portfolios.user_id = auth.uid()));

CREATE POLICY "Users can modify own mutual fund holdings"
ON public.mutual_fund_holdings FOR ALL
USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = mutual_fund_holdings.portfolio_id AND portfolios.user_id = auth.uid()));

-- RLS policies for index_fund_holdings
CREATE POLICY "Users can view own index fund holdings"
ON public.index_fund_holdings FOR SELECT
USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = index_fund_holdings.portfolio_id AND portfolios.user_id = auth.uid()));

CREATE POLICY "Users can modify own index fund holdings"
ON public.index_fund_holdings FOR ALL
USING (EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = index_fund_holdings.portfolio_id AND portfolios.user_id = auth.uid()));

-- Insert 10 Large-Cap Mutual Funds
INSERT INTO public.mutual_funds (name, symbol, category, amc, nav, base_nav, expense_ratio, risk_level, one_year_return, three_year_return, five_year_return, aum, description) VALUES
('Axis Bluechip Fund', 'AXISBLU', 'large_cap', 'Axis Mutual Fund', 52.45, 52.45, 1.65, 'Moderate', 15.2, 12.8, 14.5, '₹35,000 Cr', 'Invests in top 100 companies by market cap'),
('HDFC Top 100 Fund', 'HDFCTOP', 'large_cap', 'HDFC Mutual Fund', 78.32, 78.32, 1.82, 'Moderate', 18.5, 14.2, 16.1, '₹28,500 Cr', 'Focuses on blue-chip companies with strong fundamentals'),
('ICICI Pru Bluechip Fund', 'ICICIBLU', 'large_cap', 'ICICI Prudential', 68.90, 68.90, 1.75, 'Moderate', 16.8, 13.5, 15.2, '₹42,000 Cr', 'Large-cap focused with quality stocks'),
('SBI Bluechip Fund', 'SBIBLU', 'large_cap', 'SBI Mutual Fund', 64.25, 64.25, 1.58, 'Moderate', 14.9, 11.8, 13.8, '₹38,000 Cr', 'Invests in established market leaders'),
('Mirae Asset Large Cap', 'MIRLRG', 'large_cap', 'Mirae Asset', 89.45, 89.45, 1.52, 'Moderate', 19.2, 15.6, 17.3, '₹32,000 Cr', 'Growth-oriented large-cap strategy'),
('Kotak Bluechip Fund', 'KOTBLU', 'large_cap', 'Kotak Mahindra', 45.80, 45.80, 1.68, 'Moderate', 13.8, 10.9, 12.5, '₹22,000 Cr', 'Conservative large-cap approach'),
('Nippon India Large Cap', 'NIPLRG', 'large_cap', 'Nippon India', 58.65, 58.65, 1.78, 'Moderate', 17.1, 13.2, 14.8, '₹18,500 Cr', 'Diversified large-cap portfolio'),
('Aditya Birla Frontline', 'ABFRONT', 'large_cap', 'Aditya Birla', 72.40, 72.40, 1.85, 'Moderate', 16.4, 12.6, 14.1, '₹25,000 Cr', 'Frontline equity fund'),
('Tata Large Cap Fund', 'TATALRG', 'large_cap', 'Tata Mutual Fund', 42.15, 42.15, 1.72, 'Moderate', 15.6, 11.4, 13.2, '₹12,000 Cr', 'Quality-focused large-cap fund'),
('UTI Mastershare', 'UTIMST', 'large_cap', 'UTI Mutual Fund', 185.60, 185.60, 1.45, 'Moderate', 14.2, 10.5, 12.8, '₹15,000 Cr', 'One of India oldest equity funds'),

-- Insert 10 Mid-Cap Mutual Funds
('HDFC Mid-Cap Opportunities', 'HDFCMID', 'mid_cap', 'HDFC Mutual Fund', 112.35, 112.35, 1.92, 'High', 24.5, 18.2, 20.5, '₹45,000 Cr', 'Leading mid-cap fund with proven track record'),
('Kotak Emerging Equity', 'KOTEMR', 'mid_cap', 'Kotak Mahindra', 85.20, 85.20, 1.78, 'High', 22.8, 17.5, 19.2, '₹28,000 Cr', 'Focuses on emerging mid-sized companies'),
('Axis Midcap Fund', 'AXISMID', 'mid_cap', 'Axis Mutual Fund', 72.45, 72.45, 1.85, 'High', 26.2, 19.8, 21.5, '₹22,000 Cr', 'Quality mid-cap stock picker'),
('DSP Midcap Fund', 'DSPMID', 'mid_cap', 'DSP Mutual Fund', 98.60, 98.60, 1.88, 'High', 23.4, 16.9, 18.8, '₹18,000 Cr', 'Consistent mid-cap performer'),
('Nippon India Growth Fund', 'NIPGROW', 'mid_cap', 'Nippon India', 2450.80, 2450.80, 1.75, 'High', 21.6, 15.8, 17.5, '₹24,000 Cr', 'Growth-focused mid-cap strategy'),
('SBI Magnum Midcap', 'SBIMAG', 'mid_cap', 'SBI Mutual Fund', 168.45, 168.45, 1.82, 'High', 25.8, 18.9, 20.2, '₹16,000 Cr', 'Diversified mid-cap portfolio'),
('ICICI Pru Midcap Fund', 'ICICIMID', 'mid_cap', 'ICICI Prudential', 195.30, 195.30, 1.95, 'High', 20.4, 14.6, 16.8, '₹12,000 Cr', 'Value-oriented mid-cap approach'),
('Invesco India Midcap', 'INVMID', 'mid_cap', 'Invesco Mutual Fund', 105.75, 105.75, 1.90, 'High', 27.5, 20.2, 22.1, '₹8,500 Cr', 'High-conviction mid-cap picks'),
('Tata Midcap Growth', 'TATAMID', 'mid_cap', 'Tata Mutual Fund', 285.40, 285.40, 1.88, 'High', 22.1, 16.2, 18.4, '₹6,800 Cr', 'Growth-oriented mid-cap fund'),
('Motilal Oswal Midcap', 'MOTMID', 'mid_cap', 'Motilal Oswal', 62.85, 62.85, 1.72, 'High', 28.9, 21.5, 23.2, '₹10,500 Cr', 'Focused mid-cap portfolio'),

-- Insert 10 Small-Cap Mutual Funds
('SBI Small Cap Fund', 'SBISML', 'small_cap', 'SBI Mutual Fund', 142.60, 142.60, 1.95, 'Very High', 32.5, 24.8, 28.2, '₹28,000 Cr', 'Premier small-cap fund'),
('Nippon India Small Cap', 'NIPSML', 'small_cap', 'Nippon India', 118.45, 118.45, 1.88, 'Very High', 35.2, 26.5, 29.8, '₹48,000 Cr', 'Largest small-cap fund by AUM'),
('Axis Small Cap Fund', 'AXISSML', 'small_cap', 'Axis Mutual Fund', 78.90, 78.90, 1.92, 'Very High', 29.8, 22.4, 25.6, '₹18,000 Cr', 'Quality-focused small-cap picks'),
('HDFC Small Cap Fund', 'HDFCSML', 'small_cap', 'HDFC Mutual Fund', 95.25, 95.25, 1.85, 'Very High', 28.4, 20.8, 24.2, '₹22,000 Cr', 'Value-oriented small-cap strategy'),
('Kotak Small Cap Fund', 'KOTSML', 'small_cap', 'Kotak Mahindra', 185.70, 185.70, 1.90, 'Very High', 31.6, 23.9, 27.1, '₹14,000 Cr', 'Emerging small-cap opportunities'),
('DSP Small Cap Fund', 'DSPSML', 'small_cap', 'DSP Mutual Fund', 132.40, 132.40, 1.98, 'Very High', 26.8, 19.5, 22.8, '₹12,000 Cr', 'Diversified small-cap portfolio'),
('ICICI Pru Smallcap Fund', 'ICICISML', 'small_cap', 'ICICI Prudential', 68.55, 68.55, 1.92, 'Very High', 33.4, 25.2, 28.5, '₹8,500 Cr', 'Growth-focused small-cap fund'),
('Tata Small Cap Fund', 'TATASML', 'small_cap', 'Tata Mutual Fund', 28.45, 28.45, 1.85, 'Very High', 30.2, 22.8, 26.4, '₹6,200 Cr', 'New-age small-cap opportunities'),
('Canara Robeco Small Cap', 'CANSML', 'small_cap', 'Canara Robeco', 32.80, 32.80, 1.88, 'Very High', 34.8, 26.1, 29.2, '₹9,800 Cr', 'Consistent small-cap performer'),
('Quant Small Cap Fund', 'QNTSML', 'small_cap', 'Quant Mutual Fund', 195.60, 195.60, 1.75, 'Very High', 42.5, 32.8, 35.5, '₹18,500 Cr', 'High-momentum small-cap strategy');

-- Insert 5 Index Funds
INSERT INTO public.index_funds (name, symbol, tracking_index, amc, nav, base_nav, expense_ratio, tracking_error, one_year_return, three_year_return, five_year_return, aum, description) VALUES
('UTI Nifty 50 Index Fund', 'UTINIF', 'Nifty 50', 'UTI Mutual Fund', 145.80, 145.80, 0.18, 0.05, 12.8, 10.2, 12.5, '₹15,000 Cr', 'Tracks Nifty 50 index with minimal tracking error'),
('HDFC Index Fund Sensex', 'HDFCSEN', 'BSE Sensex', 'HDFC Mutual Fund', 582.45, 582.45, 0.20, 0.08, 13.2, 11.5, 13.8, '₹8,500 Cr', 'Replicates BSE Sensex performance'),
('Nippon India Nifty Next 50', 'NIPNXT', 'Nifty Next 50', 'Nippon India', 42.65, 42.65, 0.25, 0.12, 18.5, 14.2, 16.8, '₹6,200 Cr', 'Tracks next 50 companies after Nifty 50'),
('ICICI Pru Nifty Midcap 150', 'ICICIMID150', 'Nifty Midcap 150', 'ICICI Prudential', 18.90, 18.90, 0.30, 0.15, 22.4, 16.8, 19.5, '₹4,800 Cr', 'Broad mid-cap market exposure'),
('Motilal Oswal Nasdaq 100', 'MOTNASDAQ', 'Nasdaq 100', 'Motilal Oswal', 28.35, 28.35, 0.50, 0.20, 28.5, 18.9, 22.4, '₹8,200 Cr', 'US tech giants exposure for Indian investors');

-- Create triggers for updated_at
CREATE TRIGGER update_mutual_funds_updated_at
BEFORE UPDATE ON public.mutual_funds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_index_funds_updated_at
BEFORE UPDATE ON public.index_funds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mutual_fund_holdings_updated_at
BEFORE UPDATE ON public.mutual_fund_holdings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_index_fund_holdings_updated_at
BEFORE UPDATE ON public.index_fund_holdings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();