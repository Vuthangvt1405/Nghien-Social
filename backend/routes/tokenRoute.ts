import express from "express";
import { refreshToken } from "../controllers";

const router = express.Router();
// Route to refresh token
router.route("/refresh").post(refreshToken);

export { router as tokenRouter };
