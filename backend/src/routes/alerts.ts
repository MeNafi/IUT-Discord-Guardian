import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/alerts?resolved=false -> active alerts panel data
router.get("/", async (req, res) => {
  const resolved = req.query.resolved === "true";
  const alerts = await prisma.alert.findMany({
    where: { resolved },
    include: { room: true, device: true },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  res.json(alerts);
});

// POST /api/alerts/:id/resolve -> mark an alert as handled (dashboard "dismiss" button)
router.post("/:id/resolve", async (req, res) => {
  const alert = await prisma.alert.update({
    where: { id: req.params.id },
    data: { resolved: true },
  });
  res.json(alert);
});

export default router;
