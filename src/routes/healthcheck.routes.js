import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controllers.js";

const router = Router();
// console.log("it came here");
router.route("/").get(healthcheck);

export default router;
