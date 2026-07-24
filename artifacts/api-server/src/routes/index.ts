import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import tasksRouter from "./tasks";
import walletRouter from "./wallet";
import referralsRouter from "./referrals";
import achievementsRouter from "./achievements";
import leaderboardRouter from "./leaderboard";
import notificationsRouter from "./notifications";
import streakRouter from "./streak";
import adminRouter from "./admin";
import adsRouter from "./ads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(tasksRouter);
router.use(walletRouter);
router.use(referralsRouter);
router.use(achievementsRouter);
router.use(leaderboardRouter);
router.use(notificationsRouter);
router.use(streakRouter);
router.use(adminRouter);
router.use(adsRouter);

export default router;
