import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Shield, ThumbsUp, BookOpen, Heart } from "lucide-react";

const discussions = [
  {
    id: 1,
    title: "How I understood diversification through the simulator",
    author: "Priya S.",
    replies: 24,
    likes: 56,
    time: "2 hours ago",
    tag: "Learning Journey",
  },
  {
    id: 2,
    title: "Can someone explain SIP in simple words?",
    author: "Rahul M.",
    replies: 18,
    likes: 32,
    time: "4 hours ago",
    tag: "Question",
  },
  {
    id: 3,
    title: "Why do stock prices fall when interest rates rise?",
    author: "Ananya K.",
    replies: 31,
    likes: 89,
    time: "1 day ago",
    tag: "Economics",
  },
  {
    id: 4,
    title: "My experience completing the 'Survive a Crash' challenge",
    author: "Vikram T.",
    replies: 45,
    likes: 112,
    time: "2 days ago",
    tag: "Challenge",
  },
];

const guidelines = [
  {
    icon: Heart,
    title: "Be Kind",
    description: "We're all here to learn. Support each other, especially beginners.",
  },
  {
    icon: BookOpen,
    title: "Share Knowledge",
    description: "Share what you've learned, not how much virtual profit you made.",
  },
  {
    icon: Shield,
    title: "No Financial Advice",
    description: "We discuss concepts, not specific stock recommendations.",
  },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Safe Learning Space
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Community
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect with fellow learners, share your journey, and ask questions in a supportive environment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">Recent Discussions</h2>
                  <Button size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Discussion
                  </Button>
                </div>

                <div className="space-y-4">
                  {discussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                            {discussion.tag}
                          </span>
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                            {discussion.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{discussion.author}</span>
                            <span>•</span>
                            <span>{discussion.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.replies}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {discussion.likes}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="ghost" className="w-full mt-4">
                  View All Discussions
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Community Stats */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <h3 className="font-display font-bold text-foreground mb-4">Community Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Members</span>
                    </div>
                    <span className="font-bold text-foreground">12,450+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-secondary" />
                      <span className="text-sm text-muted-foreground">Discussions</span>
                    </div>
                    <span className="font-bold text-foreground">3,200+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-success" />
                      <span className="text-sm text-muted-foreground">Helpful Answers</span>
                    </div>
                    <span className="font-bold text-foreground">8,900+</span>
                  </div>
                </div>
              </div>

              {/* Community Guidelines */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <h3 className="font-display font-bold text-foreground mb-4">Community Guidelines</h3>
                <div className="space-y-4">
                  {guidelines.map((guideline, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <guideline.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground">{guideline.title}</h4>
                        <p className="text-xs text-muted-foreground">{guideline.description}</p>
                      </div>
                    </div>
                  ))}
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
