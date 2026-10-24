import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/connection';
import { initializeSchema } from './db/schema';
import { seedHouses } from './db/seed';

import authRoutes from './routes/auth';
import sortingRoutes from './routes/sorting';
import scheduleRoutes from './routes/schedule';
import lettersRoutes from './routes/letters';
import forumRoutes from './routes/forum';
import leaderboardRoutes from './routes/leaderboard';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sorting', sortingRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    console.log('[DB] Initializing database...');
    await initDatabase();
    console.log('[DB] Running schema migrations...');
    initializeSchema();
    console.log('[DB] Seeding houses...');
    seedHouses();
    console.log('[DB] Database ready ✓');

    app.listen(PORT, () => {
      console.log(`\n🏰 Hogwarts Portal server running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
