import { Router, Response } from 'express';
import { getDb, saveDb } from '../db/connection';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { generateSchedule } from '../services/ai';

const router = Router();

// POST /api/schedule/generate — Generate a class schedule based on interests
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const { interests } = req.body;

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      res.status(400).json({ error: 'interests must be a non-empty array of strings' });
      return;
    }

    // Verify user is sorted
    const userStmt = db.prepare('SELECT house_id FROM users WHERE id = ?');
    userStmt.bind([userId]);
    if (!userStmt.step()) {
      userStmt.free();
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const user = userStmt.getAsObject() as any;
    userStmt.free();

    if (!user.house_id) {
      res.status(400).json({ error: 'You must be sorted into a house before generating a schedule' });
      return;
    }

    // Get house name
    const houseStmt = db.prepare('SELECT name FROM houses WHERE id = ?');
    houseStmt.bind([user.house_id]);
    houseStmt.step();
    const house = houseStmt.getAsObject() as { name: string };
    houseStmt.free();

    // Generate schedule via AI
    const timetable = await generateSchedule(house.name, interests);

    // Upsert schedule
    const existingStmt = db.prepare('SELECT id FROM schedules WHERE user_id = ?');
    existingStmt.bind([userId]);
    const exists = existingStmt.step();
    existingStmt.free();

    if (exists) {
      db.run(
        'UPDATE schedules SET timetable = ?, interests = ?, generated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [JSON.stringify(timetable), JSON.stringify(interests), userId]
      );
    } else {
      db.run(
        'INSERT INTO schedules (user_id, timetable, interests) VALUES (?, ?, ?)',
        [userId, JSON.stringify(timetable), JSON.stringify(interests)]
      );
    }
    saveDb();

    res.json({
      house: house.name,
      interests,
      timetable
    });
  } catch (err: any) {
    console.error('[Schedule] Generate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedule — Get user's current schedule
router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;

    const stmt = db.prepare(`
      SELECT s.timetable, s.interests, s.generated_at, h.name as house_name
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      JOIN houses h ON u.house_id = h.id
      WHERE s.user_id = ?
    `);
    stmt.bind([userId]);

    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ error: 'No schedule found. Generate one first.' });
      return;
    }

    const schedule = stmt.getAsObject() as any;
    stmt.free();

    res.json({
      house: schedule.house_name,
      interests: JSON.parse(schedule.interests || '[]'),
      timetable: JSON.parse(schedule.timetable),
      generatedAt: schedule.generated_at
    });
  } catch (err: any) {
    console.error('[Schedule] Get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
