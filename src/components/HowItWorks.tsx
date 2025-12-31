import { Wallet, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    step: "01",
    title: "Get Virtual Money",
    description: "Start with ₹1,00,000 in virtual currency. No real money, no risk. Just pure learning.",
  },
  {
    icon: TrendingUp,
    step: "02",
    title: "Make Investments",
    description: "Buy and sell stocks, explore mutual funds, and build your portfolio with guided support.",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Learn Why Markets Move",
    description: "Understand economics, inflation, and market psychology through real-time lessons.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process designed for absolute beginners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent z-0">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                </div>
              )}

              <div className="relative bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 group-hover:-translate-y-1">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
