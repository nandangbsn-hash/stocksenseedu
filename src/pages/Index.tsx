import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorks } from "@/components/HowItWorks";
import { WhyStockSense } from "@/components/WhyStockSense";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Trophy } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <WhyStockSense />
        
        {/* CTA Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto gradient-hero rounded-3xl p-10 md:p-16 text-center shadow-elevated">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of beginners who are building financial confidence without risking real money.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/simulator">
                  <Button variant="hero" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    Get Your ₹1,00,000
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/learn">
                  <Button variant="heroOutline" size="lg">
                    <BookOpen className="w-5 h-5" />
                    Explore Lessons
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Link to="/learn" className="group">
                <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-4 hover:shadow-soft hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Start Learning</h3>
                    <p className="text-sm text-muted-foreground">9 beginner-friendly lessons</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link to="/challenges" className="group">
                <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-4 hover:shadow-soft hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Trophy className="w-7 h-7 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Weekly Challenges</h3>
                    <p className="text-sm text-muted-foreground">Earn badges, build skills</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
