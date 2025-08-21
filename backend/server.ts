import express from "express";
import cors from "cors";
import { userRouter, postRouter, commentRouter, encryptRouter } from "./routes";
import { errorHandler } from "./middlewares";
import { tokenRouter } from "./routes/tokenRoute";
import { adminMiddleware } from "./middlewares/adminMiddleware";
import { adminRouter } from "./routes/admin/setAdminRoute";
import dotenv from "dotenv";
dotenv.config();
import { cloneUpload, uploadPictureGetUrl } from "./controllers";
import { upload } from "./utility/Multer";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONT_END_IP,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "x-google-token",
    ],
  })
);

// //nodemailer stuff
// let transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // true for 465, false for other ports"
//   pool: true,
//   auth: {
//     user: process.env.AUTH_EMAIL,
//     pass: process.env.AUTH_PASSWORD,
//   },
// });

// //testing success
// transporter.verify((error, success) => {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Server is ready to take our messages");
//   }
// });

// app.get("/test-email", async (req, res) => {
//   try {
//     const info = await transporter.sendMail({
//       from: process.env.AUTH_EMAIL,
//       to: "minatocs254@gmail.com",
//       subject: "Testing",
//       text: "Testing",
//       html: "<b>Testing</b>",
//     });
//     res.json({ success: true, messageId: info.messageId });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

//admin router
app.use("/api/admin", adminMiddleware, adminRouter);

// up image and get url
app.post("/api/getUrl", uploadPictureGetUrl);

// Importing routes
// user router
app.use("/api/users", userRouter);

app.use("/api/posts", postRouter);

app.use("/api/comments", commentRouter);

app.use("/api/crypto/post", encryptRouter);

//api for token refresh
app.use("/api/token", tokenRouter);

// Error handling middleware
app.use(errorHandler);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
