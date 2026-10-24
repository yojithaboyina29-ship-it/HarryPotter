import { Router, Response } from 'express';
import { getDb, saveDb } from '../db/connection';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { containsProfanity } from '../services/profanity';
import { awardPoints, POINT_VALUES } from '../services/points';

const router = Router();

// GET /api/forum/posts — Get posts for a house
router.get('/posts', (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const house = req.query.house as string | undefined;

    let query: string;
    let params: any[];

    if (house) {
      query = `
        SELECT p.id, p.title, p.body, p.upvotes, p.created_at,
               u.username as author_username,
               h.name as house_name,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        JOIN houses h ON p.house_id = h.id
        WHERE h.name = ?
        ORDER BY p.created_at DESC
      `;
      params = [house];
    } else {
      query = `
        SELECT p.id, p.title, p.body, p.upvotes, p.created_at,
               u.username as author_username,
               h.name as house_name,
               (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.author_id = u.id
        JOIN houses h ON p.house_id = h.id
        ORDER BY p.created_at DESC
      `;
      params = [];
    }

    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const posts: any[] = [];
    while (stmt.step()) {
      posts.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ posts });
  } catch (err: any) {
    console.error('[Forum] Get posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/forum/posts — Create a post
router.post('/posts', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const { title, body } = req.body;

    if (!title || !body) {
      res.status(400).json({ error: 'title and body are required' });
      return;
    }

    // Check profanity
    if (containsProfanity(title) || containsProfanity(body)) {
      res.status(400).json({ error: 'Your post contains inappropriate language. Please revise it.' });
      return;
    }

    // Get user's house
    const userStmt = db.prepare('SELECT house_id FROM users WHERE id = ?');
    userStmt.bind([userId]);
    if (!userStmt.step()) {
      userStmt.free();
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = userStmt.getAsObject() as { house_id: number | null };
    userStmt.free();

    if (!user.house_id) {
      res.status(400).json({ error: 'You must be sorted into a house before posting' });
      return;
    }

    db.run(
      'INSERT INTO posts (author_id, house_id, title, body) VALUES (?, ?, ?, ?)',
      [userId, user.house_id, title, body]
    );
    saveDb();

    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const { id: postId } = idStmt.getAsObject() as { id: number };
    idStmt.free();

    // Award points for creating a post
    awardPoints(userId, user.house_id, POINT_VALUES.CREATE_POST, 'Created a forum post');

    res.status(201).json({
      id: postId,
      title,
      body,
      authorUsername: req.username,
      upvotes: 0,
      commentCount: 0
    });
  } catch (err: any) {
    console.error('[Forum] Create post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/forum/posts/:id — Get a single post with comments
router.get('/posts/:id', (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const postId = parseInt(rawId, 10);

    if (isNaN(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    // Get post
    const postStmt = db.prepare(`
      SELECT p.id, p.title, p.body, p.upvotes, p.created_at,
             u.username as author_username,
             h.name as house_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      JOIN houses h ON p.house_id = h.id
      WHERE p.id = ?
    `);
    postStmt.bind([postId]);

    if (!postStmt.step()) {
      postStmt.free();
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const post = postStmt.getAsObject() as any;
    postStmt.free();

    // Get comments
    const commentStmt = db.prepare(`
      SELECT c.id, c.body, c.created_at, u.username as author_username
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `);
    commentStmt.bind([postId]);

    const comments: any[] = [];
    while (commentStmt.step()) {
      comments.push(commentStmt.getAsObject());
    }
    commentStmt.free();

    res.json({
      post: { ...post, comments }
    });
  } catch (err: any) {
    console.error('[Forum] Get post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/forum/posts/:id/comments — Add a comment
router.post('/posts/:id/comments', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const postId = parseInt(rawId, 10);
    const { body } = req.body;

    if (isNaN(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    if (!body) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    if (containsProfanity(body)) {
      res.status(400).json({ error: 'Your comment contains inappropriate language. Please revise it.' });
      return;
    }

    // Verify post exists
    const postStmt = db.prepare('SELECT id FROM posts WHERE id = ?');
    postStmt.bind([postId]);
    if (!postStmt.step()) {
      postStmt.free();
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    postStmt.free();

    db.run(
      'INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)',
      [postId, userId, body]
    );
    saveDb();

    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const { id: commentId } = idStmt.getAsObject() as { id: number };
    idStmt.free();

    // Award points for commenting
    const userStmt = db.prepare('SELECT house_id FROM users WHERE id = ?');
    userStmt.bind([userId]);
    if (userStmt.step()) {
      const user = userStmt.getAsObject() as { house_id: number | null };
      if (user.house_id) {
        awardPoints(userId, user.house_id, POINT_VALUES.CREATE_COMMENT, 'Added a comment');
      }
    }
    userStmt.free();

    res.status(201).json({
      id: commentId,
      body,
      authorUsername: req.username,
      postId
    });
  } catch (err: any) {
    console.error('[Forum] Add comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/forum/posts/:id/upvote — Toggle upvote on a post
router.post('/posts/:id/upvote', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const postId = parseInt(rawId, 10);

    if (isNaN(postId)) {
      res.status(400).json({ error: 'Invalid post ID' });
      return;
    }

    // Verify post exists and get author info
    const postStmt = db.prepare('SELECT id, author_id FROM posts WHERE id = ?');
    postStmt.bind([postId]);
    if (!postStmt.step()) {
      postStmt.free();
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const post = postStmt.getAsObject() as { id: number; author_id: number };
    postStmt.free();

    // Check if already voted
    const voteStmt = db.prepare('SELECT id FROM post_votes WHERE post_id = ? AND user_id = ?');
    voteStmt.bind([postId, userId]);
    const alreadyVoted = voteStmt.step();
    voteStmt.free();

    if (alreadyVoted) {
      // Remove upvote
      db.run('DELETE FROM post_votes WHERE post_id = ? AND user_id = ?', [postId, userId]);
      db.run('UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?', [postId]);
      saveDb();

      // Get updated count
      const countStmt = db.prepare('SELECT upvotes FROM posts WHERE id = ?');
      countStmt.bind([postId]);
      countStmt.step();
      const updated = countStmt.getAsObject() as { upvotes: number };
      countStmt.free();

      res.json({ upvoted: false, upvotes: updated.upvotes });
    } else {
      // Add upvote
      db.run('INSERT INTO post_votes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
      db.run('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?', [postId]);
      saveDb();

      // Award points to the post author
      const authorStmt = db.prepare('SELECT house_id FROM users WHERE id = ?');
      authorStmt.bind([post.author_id]);
      if (authorStmt.step()) {
        const author = authorStmt.getAsObject() as { house_id: number | null };
        if (author.house_id) {
          awardPoints(post.author_id, author.house_id, POINT_VALUES.RECEIVE_UPVOTE, 'Received an upvote');
        }
      }
      authorStmt.free();

      // Get updated count
      const countStmt = db.prepare('SELECT upvotes FROM posts WHERE id = ?');
      countStmt.bind([postId]);
      countStmt.step();
      const updated = countStmt.getAsObject() as { upvotes: number };
      countStmt.free();

      res.json({ upvoted: true, upvotes: updated.upvotes });
    }
  } catch (err: any) {
    console.error('[Forum] Upvote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
