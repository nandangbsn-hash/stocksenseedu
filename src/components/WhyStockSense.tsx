import { Shield, GraduationCap, MapPin, BookOpen, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "No Real Money",
    description: "Practice with virtual currency. Make mistakes, learn from them, and grow — without any financial risk.",
    color: "primary",
  },
  {
    icon: GraduationCap,
    title: "Beginner-Friendly",
    description: "Every concept is explained in simple language. No jargon, no confusion — just clear learning.",
    color: "secondary",
  },
  {
    icon: MapPin,
    title: "India-Focused",
    description: "Learn with Indian stocks, understand RBI policies, and get context that matters to you.",
    color: "info",
  },
  {
    icon: BookOpen,
    title: "Educational First",
    description: "Not a trading platform — a learning platform. Understand the 'why' behind every market movement.",
    color: "success",
  },
];

const benefits = [
  "Learn economics through real examples",
  "Understand market psychology",
  "Build long-term thinking habits",
  "Track your learning progress",
  "Earn badges and achievements",
  "Join a supportive community",
];

export function WhyStockSense() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            Why Choose Us
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why StockSense?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're not here to make you trade. We're here to make you understand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl bg-${feature.color}/10 flex items-center justify-center mb-5`}>
                <feature.icon className={`w-7 h-7 text-${feature.color}`} />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-soft">
            <h3 className="font-display text-xl font-bold text-foreground text-center mb-6">
              What You'll Gain
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
