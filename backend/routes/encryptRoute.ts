import express from "express";
import { turnOnEncryptionPost, turnOffEncryptionPost } from "../controllers";
import { authMiddleware } from "../middlewares";

const router = express.Router();

router.route("/encrypt/:postId").patch(authMiddleware, turnOnEncryptionPost);

router.route("/decrypt/:postId").patch(authMiddleware, turnOffEncryptionPost);

export { router as encryptRouter };
