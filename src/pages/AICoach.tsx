import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  PiggyBank, 
  Shield,
  Loader2,
  MessageCircle,
  Lightbulb,
  IndianRupee,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  { icon: BookOpen, text: "How do I start investing in stocks?", color: "from-primary to-accent" },
  { icon: TrendingUp, text: "What is a SIP and why should I start one?", color: "from-success to-accent" },
  { icon: PiggyBank, text: "How much should I save each month?", color: "from-warning to-primary" },
  { icon: Shield, text: "How do I manage risk in my portfolio?", color: "from-info to-primary" },
  { icon: IndianRupee, text: "Explain mutual funds in simple terms", color: "from-accent to-success" },
  { icon: Lightbulb, text: "What is diversification and why is it important?", color: "from-primary to-info" },
];

export default function AICoach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          throw new Error("Rate limited. Please wait a moment and try again.");
        }
        if (resp.status === 402) {
          throw new Error("Service temporarily unavailable. Please try again later.");
        }
        throw new Error("Failed to connect to AI coach");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add empty assistant message
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error("AI Coach error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: `I'm sorry, I encountered an issue: ${error.message}. Please try again!` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    streamChat(text);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Meet Your AI Financial Coach</h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Get personalized guidance on investing, saving, and building wealth. Sign up to start your learning journey!
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Start Learning Free
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 pb-4 flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex flex-col max-w-4xl">
          {/* Header */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-success flex items-center justify-center shadow-lg">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
                  Financial Coach
                </h1>
                <p className="text-sm text-muted-foreground">Your personal AI guide to smart investing</p>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-card/50 rounded-2xl border border-border/50 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-bold mb-2">How can I help you today?</h2>
                  <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
                    Ask me anything about investing, saving, or managing your money. I'm here to help you learn!
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(q.text)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 text-left group"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${q.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <q.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                          {q.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-gradient-to-br from-primary via-accent to-success text-white"
                      }`}>
                        {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/80 text-foreground rounded-tl-sm"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-accent to-success flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted/80 rounded-2xl rounded-tl-sm px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-card/80">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about investing..."
                  className="flex-1 bg-background/50"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-2">
                AI responses are for educational purposes only. Not financial advice.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
