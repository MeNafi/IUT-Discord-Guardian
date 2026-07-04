import { Router } from "express";
import { getFullSnapshot } from "../services/snapshot";

const router = Router();

// GET /api/usage -> used by dashboard's live power meter and the !usage bot command
//
// NOTE on kWh estimate (documented assumption, not hidden):
// We don't have real continuous current-integration hardware, so "today's kWh"
// is a simplified estimate = (current total watts) * (hours elapsed since
// midnight) / 1000. This is intentionally approximate for the demo; a more
// accurate version would integrate the Reading table's watts-over-time.
router.get("/", async (_req, res) => {
  const snapshot = await getFullSnapshot();

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const hoursElapsedToday = (now.getTime() - midnight.getTime()) / (1000 * 60 * 60);

  const estimatedKwhToday = Number(
    ((snapshot.totalWatts * hoursElapsedToday) / 1000).toFixed(2)
  );

  res.json({
    totalWattsNow: snapshot.totalWatts,
    estimatedKwhToday,
    perRoom: snapshot.rooms.map((r) => ({ room: r.name, watts: r.totalWatts })),
    timestamp: snapshot.timestamp,
  });
});

export default router;
