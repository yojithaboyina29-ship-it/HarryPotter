import { Router, Response } from 'express';
import { getDb, saveDb } from '../db/connection';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { styleLetter } from '../services/ai';
import { containsProfanity, cleanText } from '../services/profanity';
import { awardPoints, POINT_VALUES } from '../services/points';

const OWL_NAMES = [
  'Hedwig Jr.', 'Errol II', 'Pigwidgeon', 'Athena', 'Mercury',
  'Artemis', 'Apollo', 'Luna', 'Nimbus', 'Shadow', 'Whisper', 'Strix'
];

function randomOwl(): string {
  return OWL_NAMES[Math.floor(Math.random() * OWL_NAMES.length)];
}

const router = Router();

// POST /api/letters/send — Send a letter
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const senderId = req.userId!;
    const { recipientUsername, subject, body, usemagicstyle } = req.body;

    if (!recipientUsername || !subject || !body) {
      res.status(400).json({ error: 'recipientUsername, subject, and body are required' });
      return;
    }

    // Check profanity
    if (containsProfanity(subject) || containsProfanity(body)) {
      res.status(400).json({ error: 'Your letter contains inappropriate language. Please revise it.' });
      return;
    }

    // Find recipient
    const recipientStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    recipientStmt.bind([recipientUsername]);
    if (!recipientStmt.step()) {
      recipientStmt.free();
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }
    const recipient = recipientStmt.getAsObject() as { id: number };
    recipientStmt.free();

    if (recipient.id === senderId) {
      res.status(400).json({ error: 'You cannot send a letter to yourself' });
      return;
    }

    // Optionally style the letter
    let styledBody: string | null = null;
    if (usemagicstyle) {
      styledBody = await styleLetter(body);
    }

    const owlName = randomOwl();

    // Simulated delivery delay: 10-60 seconds from now
    const delaySeconds = Math.floor(Math.random() * 51) + 10;
    const deliveredAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

    db.run(
      `INSERT INTO letters (sender_id, recipient_id, subject, body, styled_body, owl_name, delivered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [senderId, recipient.id, subject, body, styledBody, owlName, deliveredAt]
    );
    saveDb();

    const idStmt = db.prepare('SELECT last_insert_rowid() as id');
    idStmt.step();
    const { id: letterId } = idStmt.getAsObject() as { id: number };
    idStmt.free();

    // Award points for sending a letter — need sender's house
    const senderStmt = db.prepare('SELECT house_id FROM users WHERE id = ?');
    senderStmt.bind([senderId]);
    if (senderStmt.step()) {
      const sender = senderStmt.getAsObject() as { house_id: number | null };
      if (sender.house_id) {
        awardPoints(senderId, sender.house_id, POINT_VALUES.SEND_LETTER, 'Sent an owl post');
      }
    }
    senderStmt.free();

    res.status(201).json({
      id: letterId,
      owlName,
      deliveredAt,
      message: `Your letter has been entrusted to ${owlName}! It will arrive shortly.`
    });
  } catch (err: any) {
    console.error('[Letters] Send error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/letters/inbox — Get received letters
router.get('/inbox', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;

    const stmt = db.prepare(`
      SELECT l.id, l.subject, l.body, l.styled_body, l.owl_name,
             l.is_read, l.sent_at, l.delivered_at,
             u.username as sender_username
      FROM letters l
      JOIN users u ON l.sender_id = u.id
      WHERE l.recipient_id = ?
      ORDER BY l.sent_at DESC
    `);
    stmt.bind([userId]);

    const letters: any[] = [];
    while (stmt.step()) {
      const letter = stmt.getAsObject() as any;
      letters.push({
        id: letter.id,
        subject: letter.subject,
        body: letter.body,
        styledBody: letter.styled_body || null,
        owlName: letter.owl_name,
        isRead: !!letter.is_read,
        sentAt: letter.sent_at,
        deliveredAt: letter.delivered_at,
        senderUsername: letter.sender_username,
        isDelivered: new Date(letter.delivered_at) <= new Date()
      });
    }
    stmt.free();

    res.json({ letters });
  } catch (err: any) {
    console.error('[Letters] Inbox error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/letters/sent — Get sent letters
router.get('/sent', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;

    const stmt = db.prepare(`
      SELECT l.id, l.subject, l.body, l.styled_body, l.owl_name,
             l.is_read, l.sent_at, l.delivered_at,
             u.username as recipient_username
      FROM letters l
      JOIN users u ON l.recipient_id = u.id
      WHERE l.sender_id = ?
      ORDER BY l.sent_at DESC
    `);
    stmt.bind([userId]);

    const letters: any[] = [];
    while (stmt.step()) {
      const letter = stmt.getAsObject() as any;
      letters.push({
        id: letter.id,
        subject: letter.subject,
        body: letter.body,
        styledBody: letter.styled_body || null,
        owlName: letter.owl_name,
        isRead: !!letter.is_read,
        sentAt: letter.sent_at,
        deliveredAt: letter.delivered_at,
        recipientUsername: letter.recipient_username,
        isDelivered: new Date(letter.delivered_at) <= new Date()
      });
    }
    stmt.free();

    res.json({ letters });
  } catch (err: any) {
    console.error('[Letters] Sent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/letters/:id/read — Mark letter as read
router.patch('/:id/read', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const letterId = parseInt(rawId, 10);

    if (isNaN(letterId)) {
      res.status(400).json({ error: 'Invalid letter ID' });
      return;
    }

    // Verify the letter belongs to the user (they are the recipient)
    const stmt = db.prepare('SELECT id FROM letters WHERE id = ? AND recipient_id = ?');
    stmt.bind([letterId, userId]);
    if (!stmt.step()) {
      stmt.free();
      res.status(404).json({ error: 'Letter not found' });
      return;
    }
    stmt.free();

    db.run('UPDATE letters SET is_read = 1 WHERE id = ?', [letterId]);
    saveDb();

    res.json({ message: 'Letter marked as read' });
  } catch (err: any) {
    console.error('[Letters] Read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/letters/style — Preview magical styling
router.post('/style', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { body } = req.body;

    if (!body) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    const styledBody = await styleLetter(body);

    res.json({ original: body, styled: styledBody });
  } catch (err: any) {
    console.error('[Letters] Style error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
