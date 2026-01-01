import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tag: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  };
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  };
  isLiked?: boolean;
  replies?: Comment[];
}

export function useCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          username, full_name, avatar_url, level
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

    // Check which posts the current user has liked
    let likedPostIds: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      likedPostIds = likes?.map(l => l.post_id) || [];
    }

    const postsWithLikes = postsData?.map(post => ({
      ...post,
      profile: post.profiles,
      isLiked: likedPostIds.includes(post.id),
    })) || [];

    setPosts(postsWithLikes);
    setLoading(false);
  }, [user]);

  const createPost = async (title: string, content: string, tag: string) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title,
        content,
        tag,
      })
      .select()
      .single();

    if (error) throw error;

    await fetchPosts();
    return data;
  };

  const toggleLikePost = async (postId: string) => {
    if (!user) throw new Error('Not authenticated');

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.isLiked) {
      // Unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      // Like
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
    }

    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, isLiked: !p.isLiked, likes_count: p.isLiked ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ));
  };

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          username, full_name, avatar_url, level
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // Check which comments the current user has liked
    let likedCommentIds: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);
      
      likedCommentIds = likes?.map(l => l.comment_id) || [];
    }

    // Organize into parent and replies
    const commentsWithLikes = data?.map(comment => ({
      ...comment,
      profile: comment.profiles,
      isLiked: likedCommentIds.includes(comment.id),
    })) || [];

    // Build nested structure
    const parentComments = commentsWithLikes.filter(c => !c.parent_id);
    const replies = commentsWithLikes.filter(c => c.parent_id);

    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parent_id === parent.id),
    }));
  };

  const addComment = async (postId: string, content: string, parentId?: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      });

    if (error) throw error;

    // Update post comments count locally
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, comments_count: p.comments_count + 1 }
        : p
    ));
  };

  const toggleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) throw new Error('Not authenticated');

    if (isLiked) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: user.id });
    }
  };

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription for posts
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return {
    posts,
    loading,
    createPost,
    toggleLikePost,
    fetchComments,
    addComment,
    toggleLikeComment,
    refreshPosts: fetchPosts,
  };
}
