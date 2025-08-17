import express from "express";
import { turnOnEncryptionPost, turnOffEncryptionPost } from "../controllers";

const router = express.Router();

router.route("/encrypt/:postId").patch(turnOnEncryptionPost);

router.route("/decrypt/:postId").patch(turnOffEncryptionPost);

export { router as encryptRouter };
