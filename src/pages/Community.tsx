import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCommunity, Post, Comment } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  Users, 
  Shield, 
  Heart, 
  BookOpen, 
  Send,
  Reply,
  MoreHorizontal,
  Clock,
  User,
  PlusCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const tags = ['General', 'Question', 'Learning Journey', 'Economics', 'Challenge', 'Tip'];

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

function PostCard({
  post,
  onLike,
  onComment,
  isExpanded,
  onToggleExpand,
}: {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const displayName = post.profile?.full_name || post.profile?.username || "Anonymous";
  const level = post.profile?.level || "Beginner";
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
      {/* Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-accent/40 to-primary/20" />

      <div className="p-5">
        {/* Post Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground truncate">{displayName}</span>
                <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full border border-border/60">
                  {level}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/15">
            {post.tag}
          </span>
        </div>

        {/* Post Content */}
        <h3 className="font-display font-bold text-lg text-foreground mb-2">{post.title}</h3>
        <p className={`text-muted-foreground text-sm mb-4 ${isExpanded ? "" : "line-clamp-3"}`}>
          {post.content}
        </p>

        {/* Post Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={post.isLiked ? "text-destructive" : "text-muted-foreground"}
          >
            <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
            {post.likes_count}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="text-muted-foreground"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {post.comments_count}
            <span className="ml-1">{isExpanded ? "Hide" : "View"}</span>
          </Button>

          <div className="ml-auto" />

          <Button type="button" variant="outline" size="sm" onClick={onToggleExpand}>
            {isExpanded ? "Close" : "Open"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentSection({ 
  postId, 
  fetchComments, 
  addComment,
  toggleLikeComment,
}: { 
  postId: string;
  fetchComments: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<void>;
  toggleLikeComment: (commentId: string, isLiked: boolean) => Promise<void>;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchComments(postId);
    setComments(data);
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({ title: "Please sign in to comment", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) return;

    try {
      await addComment(postId, newComment.trim());
      setNewComment('');
      await loadComments();
      toast({ title: "Comment added!" });
    } catch (error) {
      toast({ title: "Failed to add comment", variant: "destructive" });
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!user) {
      toast({ title: "Please sign in to reply", variant: "destructive" });
      return;
    }
    if (!replyContent.trim()) return;

    try {
      await addComment(postId, replyContent.trim(), parentId);
      setReplyingTo(null);
      setReplyContent('');
      await loadComments();
      toast({ title: "Reply added!" });
    } catch (error) {
      toast({ title: "Failed to add reply", variant: "destructive" });
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!user) {
      toast({ title: "Please sign in to like", variant: "destructive" });
      return;
    }
    
    await toggleLikeComment(comment.id, !!comment.isLiked);
    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === comment.id) {
        return { ...c, isLiked: !c.isLiked, likes_count: c.isLiked ? c.likes_count - 1 : c.likes_count + 1 };
      }
      if (c.replies) {
        return {
          ...c,
          replies: c.replies.map(r => 
            r.id === comment.id 
              ? { ...r, isLiked: !r.isLiked, likes_count: r.isLiked ? r.likes_count - 1 : r.likes_count + 1 }
              : r
          )
        };
      }
      return c;
    }));
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="bg-card/50 border border-border rounded-2xl p-4 mt-4 space-y-4">
      {/* Add Comment */}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
        />
        <Button size="icon" onClick={handleAddComment}>
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-4">Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Parent Comment */}
              <div className="bg-card rounded-xl p-4 border border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-medium text-sm">
                    {comment.profile?.full_name || comment.profile?.username || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-2">{comment.content}</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikeComment(comment)}
                    className={comment.isLiked ? "text-destructive" : "text-muted-foreground"}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${comment.isLiked ? "fill-current" : ""}`} />
                    {comment.likes_count}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-muted-foreground"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="flex gap-2 mt-3 pl-4">
                    <Input
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={() => handleAddReply(comment.id)}>
                      Reply
                    </Button>
                  </div>
                )}
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-muted/30 rounded-xl p-4 border border-border/40">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-secondary" />
                        </div>
                        <span className="font-medium text-xs">
                          {reply.profile?.full_name || reply.profile?.username || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{reply.content}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeComment(reply)}
                        className={reply.isLiked ? "text-destructive" : "text-muted-foreground"}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${reply.isLiked ? "fill-current" : ""}`} />
                        {reply.likes_count}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const { user } = useAuth();
  const { posts, loading, createPost, toggleLikePost, fetchComments, addComment, toggleLikeComment } = useCommunity();
  
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('General');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async () => {
    if (!user) {
      toast({ title: "Please sign in to post", variant: "destructive" });
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost(newPostTitle.trim(), newPostContent.trim(), newPostTag);
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostTag('General');
      toast({ title: "Post created! 🎉" });
    } catch (error) {
      toast({ title: "Failed to create post", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "Please sign in to like", variant: "destructive" });
      return;
    }
    await toggleLikePost(postId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-10">
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
            <div className="lg:col-span-2 space-y-4">
              {/* New Post Button */}
              {user ? (
                <Button onClick={() => setShowNewPost(true)} className="w-full mb-4">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Start a Discussion
                </Button>
              ) : (
                <Link to="/auth" className="block mb-4">
                  <Button variant="outline" className="w-full">
                    Sign in to join the discussion
                  </Button>
                </Link>
              )}

              {/* Posts List */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No discussions yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Be the first to start a conversation!</p>
                  {user && (
                    <Button onClick={() => setShowNewPost(true)}>Start Discussion</Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <div key={post.id}>
                      <PostCard
                        post={post}
                        onLike={() => handleLike(post.id)}
                        onComment={() => {}}
                        isExpanded={expandedPost === post.id}
                        onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      />
                      
                      {expandedPost === post.id && (
                        <CommentSection
                          postId={post.id}
                          fetchComments={fetchComments}
                          addComment={addComment}
                          toggleLikeComment={toggleLikeComment}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                      <span className="text-sm text-muted-foreground">Active Learners</span>
                    </div>
                    <span className="font-bold text-foreground">{posts.length > 0 ? '1,000+' : 'Join now!'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-secondary" />
                      <span className="text-sm text-muted-foreground">Discussions</span>
                    </div>
                    <span className="font-bold text-foreground">{posts.length}</span>
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

      {/* New Post Dialog */}
      <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a Discussion</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <select
                value={newPostTag}
                onChange={(e) => setNewPostTag(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm"
              >
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="What's on your mind?"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Share your thoughts, questions, or learnings..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPost(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
