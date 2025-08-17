import express from "express";
import { setAdmin } from "../../controllers";

const router = express.Router();

router.route("/set-admin").post(setAdmin);

export { router as adminRouter };
