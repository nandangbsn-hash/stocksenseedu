import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Bookmark,
  Filter,
} from "lucide-react";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  icon_name: string;
  order_index: number;
  category: string;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  bookmarked: boolean;
}

export default function Learn() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [filter, setFilter] = useState<'all' | 'bookmarked' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('id, slug, title, description, duration, icon_name, order_index, category')
      .order('order_index');

    if (error) {
      console.error('Error fetching lessons:', error);
      return;
    }

    setLessons(data || []);
    setLoading(false);
  };

  const fetchProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, bookmarked')
      .eq('user_id', user.id);

    setProgress(data || []);
  };

  const getProgress = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  const completedCount = progress.filter(p => p.completed).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  const filteredLessons = lessons.filter(lesson => {
    const lessonProgress = getProgress(lesson.id);
    if (filter === 'bookmarked') return lessonProgress?.bookmarked;
    if (filter === 'completed') return lessonProgress?.completed;
    return true;
  });

  const categories = [...new Set(lessons.map(l => l.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
                <div className="h-12 bg-muted rounded w-2/3 mx-auto" />
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-10">
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
          {user && (
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Your Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedCount} of {lessons.length} lessons completed
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</div>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="max-w-3xl mx-auto mb-6 flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(['all', 'bookmarked', 'completed'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === 'all' ? 'All Lessons' : f}
              </Button>
            ))}
          </div>

          {/* Lessons by Category */}
          <div className="max-w-3xl mx-auto space-y-10">
            {categories.map(category => {
              const categoryLessons = filteredLessons.filter(l => l.category === category);
              if (categoryLessons.length === 0) return null;

              return (
                <div key={category}>
                  <h2 className="font-display text-xl font-bold text-foreground mb-4 capitalize flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {category === 'basics' ? 'Getting Started' : category}
                  </h2>

                  <div className="space-y-3">
                    {categoryLessons.map((lesson, index) => {
                      const lessonProgress = getProgress(lesson.id);
                      const isCompleted = lessonProgress?.completed;
                      const isBookmarked = lessonProgress?.bookmarked;

                      return (
                        <Link
                          key={lesson.id}
                          to={`/learn/${lesson.slug}`}
                          className="block animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className={`bg-card rounded-xl border border-border p-5 transition-all duration-300 hover:shadow-soft hover:border-primary/30 hover:-translate-y-0.5 ${
                            isCompleted ? 'bg-success/5' : ''
                          }`}>
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isCompleted
                                  ? 'bg-success/10 text-success'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  <span className="text-lg font-bold">{lesson.order_index}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    {lesson.title}
                                    {isBookmarked && (
                                      <Bookmark className="w-4 h-4 text-primary fill-primary" />
                                    )}
                                  </h3>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {lesson.description}
                                </p>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    {lesson.duration}
                                  </div>
                                  {isCompleted && (
                                    <span className="text-xs text-success font-medium">Completed</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredLessons.length === 0 && (
            <div className="max-w-3xl mx-auto text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No lessons found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'bookmarked' 
                  ? "You haven't bookmarked any lessons yet." 
                  : "You haven't completed any lessons yet."}
              </p>
              <Button onClick={() => setFilter('all')}>View All Lessons</Button>
            </div>
          )}

          {/* Tips Section */}
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-muted/50 rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground mb-4">💡 Learning Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Take your time with each lesson",
                  "Complete the quiz to test understanding",
                  "Bookmark lessons to revisit later",
                  "Try the simulator after each concept",
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
