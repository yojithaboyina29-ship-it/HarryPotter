import { Router, Response } from 'express';
import { getHouseLeaderboard, getTopUsers } from '../services/points';

const router = Router();

// GET /api/leaderboard/houses — House standings
router.get('/houses', (_req, res: Response): void => {
  try {
    const houses = getHouseLeaderboard();
    res.json({ houses });
  } catch (err: any) {
    console.error('[Leaderboard] Houses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard/users — Top users
router.get('/users', (req, res: Response): void => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const users = getTopUsers(limit);
    res.json({ users });
  } catch (err: any) {
    console.error('[Leaderboard] Users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
