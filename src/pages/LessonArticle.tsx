import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  icon_name: string;
  order_index: number;
  category: string;
}

interface LessonProgress {
  completed: boolean;
  bookmarked: boolean;
  quiz_score: number | null;
}

export default function LessonArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  useEffect(() => {
    fetchLesson();
    fetchAllLessons();
  }, [slug]);

  useEffect(() => {
    if (lesson && user) {
      fetchProgress();
    }
  }, [lesson, user]);

  const fetchLesson = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      navigate('/learn');
      return;
    }

    setLesson(data);
    setLoading(false);
  };

  const fetchAllLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index');
    
    if (data) setAllLessons(data);
  };

  const fetchProgress = async () => {
    if (!user || !lesson) return;

    const { data } = await supabase
      .from('lesson_progress')
      .select('completed, bookmarked, quiz_score')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    if (data) {
      setProgress(data);
      if (data.quiz_score !== null) {
        setQuizSubmitted(true);
        setQuizScore(data.quiz_score);
      }
    }
  };

  const toggleBookmark = async () => {
    if (!user || !lesson) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark lessons.",
        variant: "destructive",
      });
      return;
    }

    const newBookmarked = !progress?.bookmarked;

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        bookmarked: newBookmarked,
        completed: progress?.completed || false,
      });

    if (!error) {
      setProgress(prev => ({ ...prev!, bookmarked: newBookmarked }));
      toast({
        title: newBookmarked ? "Bookmarked!" : "Bookmark removed",
        description: newBookmarked ? "Lesson saved to your bookmarks." : "Lesson removed from bookmarks.",
      });
    }
  };

  const markAsCompleted = async () => {
    if (!user || !lesson) return;

    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        completed: true,
        bookmarked: progress?.bookmarked || false,
        completed_at: new Date().toISOString(),
        quiz_score: quizScore,
      });

    if (!error) {
      setProgress(prev => ({ ...prev!, completed: true }));
      toast({
        title: "Lesson completed! 🎉",
        description: "Great job! Keep learning.",
      });
    }
  };

  // Parse quiz questions from content
  const parseQuizQuestions = (content: string) => {
    const quizSection = content.split('## Quick Quiz')[1];
    if (!quizSection) return [];

    const questions: { question: string; options: string[]; correct: number }[] = [];
    const lines = quizSection.split('\n').filter(l => l.trim());
    
    let currentQuestion = '';
    let currentOptions: string[] = [];
    
    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        if (currentQuestion && currentOptions.length) {
          // First option is correct based on typical quiz format
          questions.push({ question: currentQuestion, options: currentOptions, correct: 1 });
        }
        currentQuestion = line.replace(/^\d+\./, '').trim();
        currentOptions = [];
      } else if (line.match(/^\s*-\s*[a-c]\)/)) {
        currentOptions.push(line.replace(/^\s*-\s*[a-c]\)/, '').trim());
      }
    });

    if (currentQuestion && currentOptions.length) {
      questions.push({ question: currentQuestion, options: currentOptions, correct: 1 });
    }

    return questions;
  };

  const handleQuizSubmit = async () => {
    if (!lesson) return;

    const questions = parseQuizQuestions(lesson.content);
    let correct = 0;
    
    questions.forEach((q, i) => {
      // For demo purposes, option "b" (index 1) is usually correct
      if (quizAnswers[i] === 'b') correct++;
    });

    const score = Math.round((correct / questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (user) {
      await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          quiz_score: score,
          bookmarked: progress?.bookmarked || false,
          completed: true,
          completed_at: new Date().toISOString(),
        });
    }

    toast({
      title: score >= 66 ? "Great job! 🎉" : "Keep learning!",
      description: `You scored ${score}% (${correct}/${questions.length} correct)`,
    });
  };

  const currentIndex = allLessons.findIndex(l => l.slug === slug);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Split content: main content and quiz section
  const mainContent = lesson?.content.split('## Quick Quiz')[0] || '';
  const quizQuestions = lesson ? parseQuizQuestions(lesson.content) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-12 bg-muted rounded w-2/3" />
              <div className="h-96 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Progress Bar */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <Progress 
            value={((currentIndex + 1) / allLessons.length) * 100} 
            className="h-1 rounded-none"
          />
        </div>

        <div className="container mx-auto px-4 max-w-3xl pt-6">
          {/* Back Link */}
          <Link 
            to="/learn"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Lessons
          </Link>

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                {lesson.category}
              </span>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                {lesson.duration}
              </div>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {lesson.title}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6">
              {lesson.description}
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleBookmark}
              >
                {progress?.bookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2 text-primary" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmark
                  </>
                )}
              </Button>

              {progress?.completed && (
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </span>
              )}
            </div>
          </header>

          {/* Article Content */}
          <article className="prose prose-slate dark:prose-invert max-w-none mb-12">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display text-3xl font-bold mt-8 mb-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display text-2xl font-bold mt-8 mb-4">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-display text-xl font-semibold mt-6 mb-3">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg my-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div className="text-foreground">{children}</div>
                    </div>
                  </div>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-muted p-3 text-left font-semibold border border-border">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="p-3 border border-border">{children}</td>
                ),
              }}
            >
              {mainContent}
            </ReactMarkdown>
          </article>

          {/* Quiz Section */}
          {quizQuestions.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-10">
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                📝 Quick Quiz
              </h2>

              <div className="space-y-6">
                {quizQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="space-y-3">
                    <p className="font-medium text-foreground">
                      {qIndex + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oIndex) => {
                        const optionLetter = String.fromCharCode(97 + oIndex);
                        const isSelected = quizAnswers[qIndex] === optionLetter;
                        const isCorrect = optionLetter === 'b';
                        
                        return (
                          <button
                            key={oIndex}
                            onClick={() => !quizSubmitted && setQuizAnswers(prev => ({
                              ...prev,
                              [qIndex]: optionLetter
                            }))}
                            disabled={quizSubmitted}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'bg-success/10 border-success text-success'
                                  : isSelected
                                  ? 'bg-destructive/10 border-destructive text-destructive'
                                  : 'border-border'
                                : isSelected
                                ? 'bg-primary/10 border-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <span className="font-medium mr-2">{optionLetter})</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <Button 
                  className="mt-6" 
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                >
                  Submit Answers
                </Button>
              ) : (
                <div className={`mt-6 p-4 rounded-lg ${
                  quizScore! >= 66 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'
                }`}>
                  <div className="flex items-center gap-2">
                    {quizScore! >= 66 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      You scored {quizScore}%! 
                      {quizScore! >= 66 ? ' Great job!' : ' Review the lesson and try again.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mark as Complete */}
          {!progress?.completed && quizSubmitted && (
            <div className="text-center mb-10">
              <Button size="lg" onClick={markAsCompleted}>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark Lesson as Complete
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            {prevLesson ? (
              <Link to={`/learn/${prevLesson.slug}`}>
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground">Previous</div>
                    <div className="font-medium">{prevLesson.title}</div>
                  </div>
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link to={`/learn/${nextLesson.slug}`}>
                <Button variant="ghost" className="gap-2">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Next</div>
                    <div className="font-medium">{nextLesson.title}</div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
