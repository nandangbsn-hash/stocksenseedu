import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Heart, Shield, GraduationCap, TrendingUp, ArrowRight, AlertTriangle } from "lucide-react";

const values = [
  {
    icon: GraduationCap,
    title: "Education First",
    description: "We exist to teach, not to encourage trading. Every feature is designed to build understanding, not profits.",
  },
  {
    icon: Shield,
    title: "No Real Risk",
    description: "Virtual money only. You can make mistakes, learn from them, and grow — without any financial consequences.",
  },
  {
    icon: Heart,
    title: "Beginner-Friendly",
    description: "No jargon, no complex charts, no assumptions. We explain everything in simple, clear language.",
  },
  {
    icon: Target,
    title: "India-Focused",
    description: "Learn with context that matters to you — Indian stocks, RBI policies, and rupee-based examples.",
  },
];

const team = [
  { name: "Education", description: "Designed by educators and finance professionals" },
  { name: "Technology", description: "Built with modern, accessible technology" },
  { name: "Community", description: "Supported by thousands of learners like you" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="max-w-3xl mx-auto text-center mb-16 pt-8">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Our Mission
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Making Financial Literacy
              <br />
              <span className="text-primary">Accessible to Everyone</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              StockSense was built with one goal: to help young Indians understand money, investing, and economics — without the fear of losing real money.
            </p>
          </div>

          {/* Values */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-soft transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why We Built This */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-muted/50 rounded-3xl p-8 md:p-12">
              <div className="max-w-2xl mx-auto text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  Why We Built StockSense
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  India has one of the youngest populations in the world, yet financial literacy remains low. 
                  Many young people either avoid investing due to fear, or jump in without understanding — often losing money. 
                  We believe education should come first. StockSense lets you experience the stock market, 
                  understand economic concepts, and build confidence — all without risking a single rupee.
                </p>
                <Link to="/simulator">
                  <Button size="lg">
                    Try the Simulator
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Team/Approach */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">Our Approach</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-foreground">{index + 1}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-warning/5 border-2 border-warning/30 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-warning-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    Important Disclaimer
                  </h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">StockSense is an educational simulator only.</strong> We do not provide financial advice, investment recommendations, or real trading services.
                    </p>
                    <p>
                      All stock data shown is simulated or delayed and should not be used for real investment decisions. The virtual money in your account has no real value.
                    </p>
                    <p>
                      Before making any real investment decisions, please consult with a qualified financial advisor. Investing in the stock market involves risk, including the potential loss of principal.
                    </p>
                    <p className="font-medium text-foreground">
                      This platform is designed for learning purposes for users aged 13-25. It is not intended to encourage real trading or gambling behavior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
