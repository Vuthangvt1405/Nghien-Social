import crypto from "crypto";
import pool from "../config/db"; // Assume có DB connection
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { User } from "./User";
dotenv.config();

function HTML(otp: number): string {
  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mã xác thực OTP - Bảo mật tài khoản</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px 0;
        line-height: 1.6;
        color: #1a1a1b;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background: transparent;
      }
      .email-container {
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }
      
      /* Header */
      .header {
        background: linear-gradient(135deg, #FF4500 0%, #ff6b35 100%);
        padding: 32px 24px;
        text-align: center;
        position: relative;
      }
      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
      }
      .header-content {
        position: relative;
        z-index: 1;
      }
      .logo {
        width: 48px;
        height: 48px;
        background: #ffffff;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .logo svg {
        width: 24px;
        height: 24px;
        fill: #FF4500;
      }
      .header h1 {
        color: #ffffff;
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header p {
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        font-weight: 400;
      }
      
      /* Main Content */
      .content {
        padding: 40px 32px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a1b;
        margin-bottom: 24px;
      }
      .message {
        font-size: 16px;
        color: #4a4a4b;
        margin-bottom: 32px;
        line-height: 1.7;
      }
      
      /* OTP Code Section */
      .otp-section {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border: 2px dashed #cbd5e0;
        border-radius: 12px;
        padding: 32px 24px;
        text-align: center;
        margin: 32px 0;
        position: relative;
      }
      .otp-label {
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 16px;
      }
      .otp-code {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 42px;
        font-weight: 800;
        color: #FF4500;
        letter-spacing: 8px;
        margin: 0;
        text-shadow: 0 2px 4px rgba(255, 69, 0, 0.2);
        background: linear-gradient(135deg, #FF4500 0%, #ff6b35 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .otp-timer {
        display: inline-flex;
        align-items: center;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        font-size: 14px;
        font-weight: 600;
        padding: 8px 16px;
        border-radius: 24px;
        margin-top: 16px;
      }
      .otp-timer svg {
        width: 16px;
        height: 16px;
        margin-right: 8px;
        fill: currentColor;
      }
      
      /* Security Warning */
      .security-warning {
        background: #fffbeb;
        border: 1px solid #fbbf24;
        border-left: 4px solid #f59e0b;
        border-radius: 8px;
        padding: 20px;
        margin: 24px 0;
      }
      .warning-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }
      .warning-icon {
        width: 20px;
        height: 20px;
        fill: #f59e0b;
        margin-right: 12px;
      }
      .warning-title {
        font-size: 16px;
        font-weight: 700;
        color: #92400e;
      }
      .warning-text {
        font-size: 14px;
        color: #a16207;
        line-height: 1.6;
      }
      
      /* Contact Section */
      .contact-section {
        background: #f8fafc;
        border-radius: 12px;
        padding: 24px;
        margin: 32px 0;
        text-align: center;
      }
      .contact-title {
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1b;
        margin-bottom: 12px;
      }
      .contact-text {
        font-size: 14px;
        color: #4a4a4b;
        margin-bottom: 20px;
      }
      .contact-button {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff !important;
        padding: 14px 28px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.2);
        position: relative;
        overflow: hidden;
      }
      .contact-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 121, 211, 0.4);
      }
      .contact-button svg {
        width: 16px;
        height: 16px;
        margin-right: 8px;
        fill: currentColor;
      }
      
      /* Footer */
      .footer {
        background: #f1f3f4;
        padding: 24px 32px;
        border-top: 1px solid #e5e7eb;
      }
      .footer-content {
        text-align: center;
      }
      .footer-text {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 16px;
        line-height: 1.5;
      }
      .footer-links {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin-bottom: 16px;
      }
      .footer-link {
        color: #6b7280;
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
      }
      .footer-link:hover {
        color: #FF4500;
      }
      .footer-brand {
        font-size: 11px;
        color: #9ca3af;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Responsive */
      @media screen and (max-width: 640px) {
        body { padding: 10px 0; }
        .email-wrapper { margin: 0 10px; }
        .content { padding: 32px 24px; }
        .header { padding: 24px 20px; }
        .header h1 { font-size: 24px; }
        .otp-code { font-size: 36px; letter-spacing: 6px; }
        .otp-section { padding: 24px 16px; }
        .contact-section { padding: 20px 16px; }
        .footer { padding: 20px 24px; }
        .footer-links { flex-wrap: wrap; gap: 16px; }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .email-container { background: #1a1a1b; border-color: #343536; }
        .content { color: #d7dadc; }
        .greeting { color: #d7dadc; }
        .message { color: #9ca3af; }
        .contact-title { color: #d7dadc; }
        .contact-text { color: #9ca3af; }
        .contact-section { background: #262729; }
        .footer { background: #161617; border-color: #343536; }
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <h1>Xác thực bảo mật</h1>
            <p>Mã OTP để bảo vệ tài khoản của bạn</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <div class="greeting">Chào bạn! 👋</div>
          
          <div class="message">
            Bạn vừa yêu cầu đặt lại mật khẩu. Để tiếp tục, vui lòng sử dụng mã xác thực OTP bên dưới:
          </div>
          
          <!-- OTP Section -->
          <div class="otp-section">
            <div class="otp-label">Mã xác thực OTP</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-timer">
              <svg viewBox="0 0 24 24">
                <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
              </svg>
              Có hiệu lực trong 10 phút
            </div>
          </div>
          
          <!-- Security Warning -->
          <div class="security-warning">
            <div class="warning-header">
              <svg class="warning-icon" viewBox="0 0 24 24">
                <path d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16"/>
              </svg>
              <div class="warning-title">⚠️ Cảnh báo bảo mật quan trọng</div>
            </div>
            <div class="warning-text">
              • <strong>Không chia sẻ</strong> mã OTP này với bất kỳ ai, kể cả nhân viên hỗ trợ<br/>
              • Chúng tôi <strong>không bao giờ</strong> yêu cầu OTP qua điện thoại hoặc email<br/>
              • Nếu bạn không thực hiện yêu cầu này, hãy <strong>bỏ qua email</strong> và đổi mật khẩu ngay<br/>
              • Báo cáo ngay với admin nếu phát hiện hoạt động đáng ngờ
            </div>
          </div>
          
          <!-- Contact Section -->
          <div class="contact-section">
            <div class="contact-title">🤔 Cần hỗ trợ hoặc có thắc mắc?</div>
            <div class="contact-text">
              admin luôn sẵn sàng hỗ trợ bạn. Đừng ngần ngại liên hệ nếu gặp bất kỳ vấn đề nào!
            </div>
            <a href="#" class="contact-button">
              <svg viewBox="0 0 24 24">
                <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7A1,1 0 0,0 14,8H16A1,1 0 0,1 17,9V16A1,1 0 0,1 16,17H8A1,1 0 0,1 7,16V9A1,1 0 0,1 8,8H10A1,1 0 0,0 11,7V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7,18A1,1 0 0,0 8,19H16A1,1 0 0,0 17,18V17H7V18Z"/>
              </svg>
              Nhắn tin với Admin
            </a>
          </div>
          
          <div class="message">
            <strong>Lưu ý:</strong> Email này được gửi tự động từ hệ thống bảo mật. Vui lòng không phản hồi trực tiếp email này.
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-text">
              Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu trên hệ thống của chúng tôi.<br/>
              Nếu không phải bạn thực hiện, vui lòng liên hệ admin ngay lập tức.
            </div>
            <div class="footer-links">
              <a href="#" class="footer-link">Chính sách bảo mật</a>
              <a href="#" class="footer-link">Điều khoản sử dụng</a>
              <a href="#" class="footer-link">Trung tâm hỗ trợ</a>
              <a href="#" class="footer-link">Liên hệ Admin</a>
            </div>
            <div class="footer-brand">
              © 2024 • Bảo mật bởi AI Security System
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

export interface IUserVerification {
  id?: number;
  userId: string;
  verificationToken: string;
  verificationType: "email" | "phone" | "password_reset";
  isVerified: boolean;
  createdAt: Date;
  expiredAt: Date;
  verifiedAt?: Date;
  attempts: number;
}

//nodemailer stuff
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports"
  pool: true,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  },
});

//testing success
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

export class UserVerification implements IUserVerification {
  public id?: number;
  public userId: string;
  public verificationToken: string;
  public verificationType: "email" | "phone" | "password_reset";
  public isVerified: boolean;
  public createdAt: Date;
  public expiredAt: Date;
  public verifiedAt?: Date;
  public attempts: number;

  constructor(data: Partial<IUserVerification>) {
    this.id = data.id;
    this.userId = data.userId!;
    this.verificationToken = data.verificationToken || this.generateToken();
    this.verificationType = data.verificationType!;
    this.isVerified = data.isVerified || false;
    this.createdAt = data.createdAt || new Date();
    this.expiredAt = new Date(this.createdAt.getTime() + 10 * 60 * 1000); // 10 phút
    this.verifiedAt = data.verifiedAt;
    this.attempts = data.attempts || 0;
  }

  private generateToken = () => {
    return crypto.randomBytes(20).toString("hex");
  };

  static async checkOTP(email: string, token: number, type: string) {
    const query = `
      SELECT *
      FROM user_verification
      WHERE user_id = ?
        AND verification_token = ?
        AND verification_type = '${type}'
`;
    //found user
    const user = await User.findOne(undefined, email, undefined);
    if (!user) {
      throw new Error("User not found");
    }
    const [rows]: any = await pool.execute(query, [user.id, token]);

    if (rows.length === 0) {
      throw new Error("Invalid OTP");
    }

    const checkVerifiedUserQuery = `UPDATE users 
set verified = 1
where id = ?`;

    await pool.execute(checkVerifiedUserQuery, [user.id]);

    const deleteTokenQuery = `DELETE FROM user_verification
WHERE user_id = ? AND verification_token = ?`;
    await pool.execute(deleteTokenQuery, [user.id, token]);

    return user;
  }

  static async sendOTP(
    id: number,
    type: "email" | "phone" | "password_reset"
  ): Promise<number> {
    // 1. Dọn dẹp các OTP đã hết hạn
    const cleanupQuery = `
      DELETE FROM user_verification
      WHERE expire_at <= NOW()
    `;
    await pool.execute(cleanupQuery);

    // 2. Đếm OTP còn hiệu lực
    const countActiveQuery = `
      SELECT COUNT(id) AS active_count
      FROM user_verification
      WHERE user_id = ?
        AND expire_at > NOW()
    `;
    const [countRows]: any = await pool.execute(countActiveQuery, [id]);
    const activeCount = countRows[0].active_count;

    // 3. Nếu >= 3 thì chặn
    if (activeCount >= 3) {
      const findLatestExpiryQuery = `
        SELECT MAX(expire_at) AS latest_expiry
        FROM user_verification
        WHERE user_id = ?
      `;
      const [expiryRows]: any = await pool.execute(findLatestExpiryQuery, [id]);
      const latestExpiry: Date = expiryRows[0].latest_expiry;

      const humanTime = latestExpiry.toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      throw new Error(
        `Bạn đã đạt giới hạn 3 OTP đang hoạt động. Vui lòng thử lại sau khi mã cuối cùng hết hạn vào khoảng ${humanTime}.`
      );
    }

    // 4. Tạo và chèn OTP mới, MySQL tự đặt expire_at
    const otp = Math.floor(100000 + Math.random() * 900000);

    const insertQuery = `
      INSERT INTO user_verification
        (user_id, verification_token, verification_type, is_verified, expire_at, attempts)
      VALUES
        (?, ?, ?, false, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 1)
    `;
    await pool.execute(insertQuery, [id, String(otp), type]);

    const user = await User.findOne(id);

    await transporter.sendMail({
      from: process.env.AUTH_EMAIL,
      to: user?.email,
      subject: "Mã OTP của bạn",
      text: `Mã OTP của bạn là: ${otp}`,
      html: HTML(otp),
    });

    return otp;
  }
}
