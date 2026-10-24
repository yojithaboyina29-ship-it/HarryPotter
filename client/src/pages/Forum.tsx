import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, Send, Plus } from 'lucide-react';
import { forum as forumApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import PageWrapper from '../components/layout/PageWrapper';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HouseBadge from '../components/ui/HouseBadge';

interface Comment {
  id: number;
  author_username: string;
  body: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  upvotes: number;
  created_at: string;
  author_username: string;
  house_name: string;
  comment_count: number;
  comments?: Comment[];
}

const HOUSES = ['All', 'Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];

export default function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedHouse, setSelectedHouse] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // New post modal / inline form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [error, setError] = useState('');

  const fetchPosts = async (house?: string) => {
    try {
      setLoading(true);
      const res = await forumApi.getPosts(house && house !== 'All' ? house : undefined);
      setPosts(res.data.posts || []);
    } catch (err: any) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(selectedHouse);
  }, [selectedHouse]);

  const handleUpvote = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to upvote posts.');
      return;
    }
    try {
      const res = await forumApi.upvote(postId);
      const updatedUpvotes = res.data.upvotes;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: updatedUpvotes } : p));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, upvotes: updatedUpvotes } : null);
      }
    } catch (err: any) {
      console.error('Failed to upvote', err);
    }
  };

  const handleSelectPost = async (postId: number) => {
    try {
      const res = await forumApi.getPost(postId);
      setSelectedPost(res.data.post);
    } catch (err) {
      console.error('Failed to load post details', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPost || !user) return;
    setSubmittingComment(true);
    try {
      const res = await forumApi.addComment(selectedPost.id, commentText);
      const newComment: Comment = {
        id: res.data.id,
        author_username: user.username,
        body: commentText,
        created_at: new Date().toISOString()
      };
      setSelectedPost(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), newComment],
        comment_count: (prev.comment_count || 0) + 1
      } : null);
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p));
      setCommentText('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a post.');
      return;
    }
    if (!user.house_name) {
      setError('You must complete the Sorting Ceremony before contributing to your house forum!');
      return;
    }
    setCreatingPost(true);
    setError('');
    try {
      await forumApi.createPost(newPostTitle, newPostBody);
      setNewPostTitle('');
      setNewPostBody('');
      setShowCreateModal(false);
      fetchPosts(selectedHouse);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold" style={{ color: 'var(--color-accent)' }}>
            🏰 Great Hall Forums
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Share wisdom, discuss spells, and earn house points for quality discussion
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> New Discussion
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {HOUSES.map(h => (
          <button
            key={h}
            onClick={() => setSelectedHouse(h)}
            className="px-4 py-2 rounded-lg text-sm font-semibold font-heading transition-all duration-200 border"
            style={{
              backgroundColor: selectedHouse === h ? 'var(--color-accent)' : 'transparent',
              color: selectedHouse === h ? '#1a0a2e' : 'var(--color-text-secondary)',
              borderColor: selectedHouse === h ? 'var(--color-accent)' : 'rgba(212,175,55,0.2)',
            }}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Main Grid: Post List and Post Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`space-y-4 ${selectedPost ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : posts.length === 0 ? (
            <Card className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p style={{ color: 'var(--color-text-secondary)' }}>No discussions found for this category yet.</p>
            </Card>
          ) : (
            posts.map(post => (
              <Card
                key={post.id}
                hover
                onClick={() => handleSelectPost(post.id)}
                className={`cursor-pointer transition-all ${selectedPost?.id === post.id ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <HouseBadge house={post.house_name} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      by {post.author_username}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {post.title}
                </h3>
                <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {post.body}
                </p>
                <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                  <button
                    onClick={(e) => handleUpvote(e, post.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-amber-400/10 transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.upvotes}</span>
                  </button>
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.comment_count} comments
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Selected Post Thread View */}
        {selectedPost && (
          <div className="lg:col-span-7">
            <Card className="sticky top-20">
              <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
                <div className="flex items-center gap-2">
                  <HouseBadge house={selectedPost.house_name} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedPost.author_username}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Close Thread ✕
                </button>
              </div>

              <h2 className="text-2xl font-heading font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {selectedPost.title}
              </h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed mb-6" style={{ color: 'var(--color-text-primary)' }}>
                {selectedPost.body}
              </p>

              {/* Comments section */}
              <div className="border-t pt-4" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                <h4 className="text-sm font-heading font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                  <MessageSquare className="w-4 h-4" /> Discussion ({selectedPost.comments?.length || 0})
                </h4>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 mb-4">
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map(c => (
                      <div key={c.id} className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>{c.author_username}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ color: 'var(--color-text-primary)' }}>{c.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>No comments yet. Start the conversation!</p>
                  )}
                </div>

                {/* Comment input form */}
                {user ? (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add your thoughts to this scroll..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs border outline-none bg-transparent"
                      style={{ borderColor: 'rgba(212,175,55,0.2)', color: 'var(--color-text-primary)' }}
                    />
                    <Button type="submit" size="sm" loading={submittingComment}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Log in to post a comment and participate.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-xl border p-6"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(212,175,55,0.3)' }}
            >
              <h3 className="text-xl font-heading font-bold mb-4" style={{ color: 'var(--color-accent)' }}>
                Start a New Scroll
              </h3>
              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Input
                  label="Title"
                  placeholder="e.g. Tips on brewing the Draught of Peace"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  required
                />
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Content
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Inscribe your thoughts here..."
                    value={newPostBody}
                    onChange={e => setNewPostBody(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border bg-transparent text-sm outline-none resize-none"
                    style={{ borderColor: 'rgba(212,175,55,0.3)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={creatingPost}>
                    Post to House Forum
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
