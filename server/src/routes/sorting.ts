import { Router, Response } from 'express';
import { getDb, saveDb } from '../db/connection';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { generateSortingQuestion, determineSortingResult, pickRandomQuestionSet } from '../services/ai';
import { awardPoints, POINT_VALUES } from '../services/points';

const router = Router();

// POST /api/sorting/start — Begin sorting ceremony
router.post('/start', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const userId = req.userId!;

    // Check if user is already sorted
    const userStmt = db.prepare('SELECT house_id FROM users WHERE id = ?');
    userStmt.bind([userId]);
    if (userStmt.step()) {
      const user = userStmt.getAsObject() as any;
      if (user.house_id) {
        userStmt.free();
        res.status(400).json({ error: 'You have already been sorted!' });
        return;
      }
    }
    userStmt.free();

    // Check for an existing incomplete session
    const sessionStmt = db.prepare(
      'SELECT id FROM sorting_sessions WHERE user_id = ? AND completed = 0'
    );
    sessionStmt.bind([userId]);
    if (sessionStmt.step()) {
      const existing = sessionStmt.getAsObject() as any;
      sessionStmt.free();

      // Delete old incomplete session so they can restart
      db.run('DELETE FROM sorting_sessions WHERE id = ?', [existing.id]);
    } else {
      sessionStmt.free();
    }

    // Pick 5 unique, randomized questions from pool for this user
    const selectedQuestions = pickRandomQuestionSet();
    const firstQuestion = selectedQuestions[0];

    // Create session storing the 5 selected questions for this user
    db.run(
      'INSERT INTO sorting_sessions (user_id, questions, answers) VALUES (?, ?, ?)',
      [userId, JSON.stringify(selectedQuestions), '[]']
    );
    saveDb();

    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const { id: sessionId } = idStmt.getAsObject() as { id: number };
    idStmt.free();

    res.json({
      sessionId,
      questionNumber: 1,
      totalQuestions: 5,
      question: firstQuestion.question,
      options: firstQuestion.options
    });
  } catch (err: any) {
    console.error('[Sorting] Start error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sorting/answer — Submit an answer
router.post('/answer', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const { sessionId, answer } = req.body;

    if (!sessionId || !answer) {
      res.status(400).json({ error: 'sessionId and answer are required' });
      return;
    }

    // Load session
    const parsedSessionId = typeof sessionId === 'string' ? parseInt(sessionId, 10) : sessionId;
    const sessionStmt = db.prepare(
      'SELECT * FROM sorting_sessions WHERE id = ? AND user_id = ? AND completed = 0'
    );
    sessionStmt.bind([parsedSessionId, userId]);
    if (!sessionStmt.step()) {
      sessionStmt.free();
      // Check if user has ANY active session for convenience
      const anyStmt = db.prepare('SELECT * FROM sorting_sessions WHERE user_id = ? AND completed = 0 ORDER BY id DESC LIMIT 1');
      anyStmt.bind([userId]);
      if (anyStmt.step()) {
        const fallbackSession = anyStmt.getAsObject() as any;
        anyStmt.free();
        // Proceed with user's latest active session
        var session = fallbackSession;
        var actualSessionId = fallbackSession.id;
      } else {
        anyStmt.free();
        res.status(404).json({ error: 'Active sorting session not found. Please click Try Again to restart the ceremony.' });
        return;
      }
    } else {
      var session = sessionStmt.getAsObject() as any;
      var actualSessionId = parsedSessionId;
      sessionStmt.free();
    }

    const questions: Array<{ question: string; options: string[] }> = JSON.parse(session.questions);
    const answers: string[] = JSON.parse(session.answers);

    // Add the answer
    answers.push(answer);

    const currentQuestionNumber = answers.length;

    if (currentQuestionNumber < 5) {
      // Pick next question from user's unique pre-assigned set (or fallback)
      const nextQuestion = questions[currentQuestionNumber] || await generateSortingQuestion(currentQuestionNumber + 1, []);

      // Update session answers
      db.run(
        'UPDATE sorting_sessions SET answers = ? WHERE id = ?',
        [JSON.stringify(answers), actualSessionId]
      );
      saveDb();

      res.json({
        sessionId: actualSessionId,
        questionNumber: currentQuestionNumber + 1,
        totalQuestions: 5,
        question: nextQuestion.question,
        options: nextQuestion.options
      });
    } else {
      // All 5 questions answered — determine result
      const qaForResult = questions.map((q, i) => ({
        question: q.question,
        answer: answers[i]
      }));

      const result = await determineSortingResult(qaForResult);

      // Get house ID
      const houseStmt = db.prepare('SELECT id FROM houses WHERE name = ?');
      houseStmt.bind([result.house]);
      houseStmt.step();
      const house = houseStmt.getAsObject() as { id: number };
      houseStmt.free();

      // Update session as completed
      db.run(
        'UPDATE sorting_sessions SET questions = ?, answers = ?, result_house = ?, hat_speech = ?, completed = 1 WHERE id = ?',
        [JSON.stringify(questions), JSON.stringify(answers), result.house, result.speech, actualSessionId]
      );

      // Update user's house
      db.run(
        'UPDATE users SET house_id = ?, sorting_reason = ? WHERE id = ?',
        [house.id, result.speech, userId]
      );
      saveDb();

      // Award points for sorting
      awardPoints(userId, house.id, POINT_VALUES.SORTING_COMPLETE, 'Sorting ceremony completed');

      res.json({
        completed: true,
        house: result.house,
        speech: result.speech,
        traits: result.traits
      });
    }
  } catch (err: any) {
    console.error('[Sorting] Answer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sorting/result — Get user's sorting result
router.get('/result', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;

    const stmt = db.prepare(`
      SELECT ss.result_house, ss.hat_speech, ss.questions, ss.answers, ss.created_at,
             h.name as house_name, h.traits, h.colors, h.motto
      FROM sorting_sessions ss
      JOIN houses h ON ss.result_house = h.name
      WHERE ss.user_id = ? AND ss.completed = 1
      ORDER BY ss.created_at DESC
      LIMIT 1
    `);
    stmt.bind([userId]);

    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ error: 'No sorting result found. Complete the sorting ceremony first.' });
      return;
    }

    const result = stmt.getAsObject() as any;
    stmt.free();

    res.json({
      house: result.house_name,
      speech: result.hat_speech,
      traits: result.traits,
      colors: result.colors,
      motto: result.motto,
      sortedAt: result.created_at
    });
  } catch (err: any) {
    console.error('[Sorting] Result error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
