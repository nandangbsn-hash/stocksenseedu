import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LessonCard, Lesson } from "@/components/LessonCard";
import { Progress } from "@/components/ui/progress";
import {
  Banknote,
  TrendingUp,
  PiggyBank,
  BarChart3,
  Target,
  Layers,
  Sparkles,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const lessons: Lesson[] = [
  {
    id: "1",
    title: "What is Money?",
    description: "Understand the basics of money, how it works, and why it has value in our economy.",
    duration: "2 min read",
    icon: Banknote,
    completed: true,
    locked: false,
  },
  {
    id: "2",
    title: "Why Inflation Matters",
    description: "Learn why prices go up over time and how it affects your savings and purchasing power.",
    duration: "3 min read",
    icon: TrendingUp,
    completed: true,
    locked: false,
  },
  {
    id: "3",
    title: "What is the Stock Market?",
    description: "Discover how the stock market works and why companies sell shares to the public.",
    duration: "4 min read",
    icon: BarChart3,
    completed: false,
    locked: false,
  },
  {
    id: "4",
    title: "What is a Share?",
    description: "Understand what it means to own a piece of a company and how share prices are determined.",
    duration: "3 min read",
    icon: Target,
    completed: false,
    locked: false,
  },
  {
    id: "5",
    title: "What are Mutual Funds?",
    description: "Learn about pooling money with others and the different types: Equity, Debt, Hybrid, and Index funds.",
    duration: "5 min read",
    icon: PiggyBank,
    completed: false,
    locked: false,
  },
  {
    id: "6",
    title: "Risk vs Return",
    description: "Understand the relationship between risk and potential returns in investing.",
    duration: "3 min read",
    icon: ShieldAlert,
    completed: false,
    locked: false,
  },
  {
    id: "7",
    title: "Diversification",
    description: "Learn why not putting all eggs in one basket is a key investing principle.",
    duration: "3 min read",
    icon: Layers,
    completed: false,
    locked: false,
  },
  {
    id: "8",
    title: "Power of Compounding",
    description: "Discover how your money can grow exponentially over time through compound interest.",
    duration: "4 min read",
    icon: Sparkles,
    completed: false,
    locked: false,
  },
  {
    id: "9",
    title: "Market Crashes & Long-Term Investing",
    description: "Understand why markets fall sometimes and why patience is your best friend.",
    duration: "5 min read",
    icon: Timer,
    completed: false,
    locked: false,
  },
];

export default function Learn() {
  const [lessonList, setLessonList] = useState(lessons);

  const completedCount = lessonList.filter((l) => l.completed).length;
  const progress = (completedCount / lessonList.length) * 100;

  const handleLessonClick = (lesson: Lesson) => {
    toast({
      title: `Opening: ${lesson.title}`,
      description: "Lesson content would open here in the full version.",
    });

    // Mark as completed for demo
    setLessonList((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Micro-Lessons
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Learn Financial Literacy
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Short, simple lessons designed for beginners. No jargon, just clear explanations that build your financial confidence.
            </p>
          </div>

          {/* Progress Section */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedCount} of {lessonList.length} lessons completed
                  </p>
                </div>
                <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {lessonList.map((lesson, index) => (
                <div key={lesson.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <LessonCard lesson={lesson} onClick={handleLessonClick} />
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-muted/50 rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-4">💡 Learning Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Take your time with each lesson",
                  "Try the simulator after each concept",
                  "Ask questions in the community",
                  "Revisit lessons when you're unsure",
                ].map((tip, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
