import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db/connection';
import { AuthRequest, authMiddleware, generateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const db = getDb();

    // Check for existing user
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?');
    checkStmt.bind([email, username]);
    if (checkStmt.step()) {
      checkStmt.free();
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }
    checkStmt.free();

    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    saveDb();

    // Get the new user id
    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const { id } = idStmt.getAsObject() as { id: number };
    idStmt.free();

    const token = generateToken(id, username);

    res.status(201).json({
      token,
      user: { id, username, email, house: null }
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = getDb();

    const stmt = db.prepare(`
      SELECT u.id, u.username, u.email, u.password_hash, u.house_id, u.sorting_reason,
             u.avatar_url, u.created_at, h.name as house_name
      FROM users u
      LEFT JOIN houses h ON u.house_id = h.id
      WHERE u.email = ?
    `);
    stmt.bind([email]);

    if (!stmt.step()) {
      stmt.free();
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = stmt.getAsObject() as any;
    stmt.free();

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id, user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        house: user.house_name || null,
        houseId: user.house_id || null,
        sortingReason: user.sorting_reason || null,
        avatarUrl: user.avatar_url || null,
        createdAt: user.created_at
      }
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT u.id, u.username, u.email, u.house_id, u.sorting_reason,
             u.avatar_url, u.created_at, h.name as house_name
      FROM users u
      LEFT JOIN houses h ON u.house_id = h.id
      WHERE u.id = ?
    `);
    stmt.bind([req.userId!]);

    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = stmt.getAsObject() as any;
    stmt.free();

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        house: user.house_name || null,
        houseId: user.house_id || null,
        sortingReason: user.sorting_reason || null,
        avatarUrl: user.avatar_url || null,
        createdAt: user.created_at
      }
    });
  } catch (err: any) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
