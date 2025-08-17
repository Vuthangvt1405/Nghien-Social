import express from "express";
import {
  createUser,
  loginUser,
  updateUser,
  getAllUsers,
  uploadAvatar,
  loginUserGoogle,
  uploadCover,
  getUserProfileByUsername,
  changePassword,
  userStats,
  handleFollowUser,
  sendOTPVerified,
  verifyOTP,
} from "../controllers";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

//get user profile (info)
router.route("/").get(getAllUsers);
//get another profile but not update
router.route("/profile/:username").get(getUserProfileByUsername);

router.route("/upload-avatar").post(authMiddleware, uploadAvatar);
router.route("/upload-cover").post(authMiddleware, uploadCover);

router.route("/sign-up").post(createUser);

router.route("/login").post(loginUser);

//login with google in this function have authenticate token google
router.route("/auth/google-auth").post(loginUserGoogle);

router.route("/edit-profile").patch(authMiddleware, updateUser);

//change password
router.route("/change-password").patch(authMiddleware, changePassword);

//get user Stats
router.route("/stats").get(userStats);

//follow another user
router.route("/follow/:id").post(authMiddleware, handleFollowUser);

//send and verified user account (email)
router.route("/OTP/:type/send").post(sendOTPVerified);
router.route("/OTP/:type/verify").post(verifyOTP);

export { router as userRouter };
