import { getDb, saveDb } from '../db/connection';

// Points awarded for various actions
export const POINT_VALUES = {
  SORTING_COMPLETE: 20,
  FIRST_LOGIN: 10,
  SEND_LETTER: 5,
  CREATE_POST: 5,
  RECEIVE_UPVOTE: 2,
  CREATE_COMMENT: 1,
} as const;

export function awardPoints(userId: number, houseId: number, points: number, reason: string): void {
  const db = getDb();

  db.run(
    `INSERT INTO points_ledger (user_id, house_id, points, reason) VALUES (?, ?, ?, ?)`,
    [userId, houseId, points, reason]
  );

  db.run(
    `UPDATE houses SET total_points = total_points + ? WHERE id = ?`,
    [points, houseId]
  );

  saveDb();
}

export function getUserPoints(userId: number): number {
  const db = getDb();
  const stmt = db.prepare(`SELECT COALESCE(SUM(points), 0) as total FROM points_ledger WHERE user_id = ?`);
  stmt.bind([userId]);

  let total = 0;
  if (stmt.step()) {
    const row = stmt.getAsObject() as { total: number };
    total = row.total;
  }
  stmt.free();
  return total;
}

export function getHouseLeaderboard(): Array<{ id: number; name: string; total_points: number; member_count: number; colors: string; motto: string }> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT h.id, h.name, h.total_points, h.colors, h.motto,
           COUNT(u.id) as member_count
    FROM houses h
    LEFT JOIN users u ON u.house_id = h.id
    GROUP BY h.id
    ORDER BY h.total_points DESC
  `);

  const results: Array<{ id: number; name: string; total_points: number; member_count: number; colors: string; motto: string }> = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as any);
  }
  stmt.free();
  return results;
}

export function getTopUsers(limit: number = 10): Array<{ username: string; house_name: string; total_points: number }> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT u.username, h.name as house_name,
           COALESCE(SUM(pl.points), 0) as total_points
    FROM users u
    JOIN houses h ON u.house_id = h.id
    LEFT JOIN points_ledger pl ON pl.user_id = u.id
    GROUP BY u.id
    ORDER BY total_points DESC
    LIMIT ?
  `);
  stmt.bind([limit]);

  const results: Array<{ username: string; house_name: string; total_points: number }> = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as any);
  }
  stmt.free();
  return results;
}
