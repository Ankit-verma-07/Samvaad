const nodemailer = require("nodemailer");

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is missing");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendOtpEmail = async ({ to, otp, expiresInMinutes }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const subject = "Welcome to SAMVAAD - Verify Your Email";
  const text = `Welcome to SAMVAAD! Your OTP code is ${otp}. It expires in ${expiresInMinutes} minutes.`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 10px;">💬</div>
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800;">SAMVAAD</h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Connect with your community in real-time</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Welcome to SAMVAAD! 🎉</h2>
                  <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Thank you for joining our community! To complete your registration and start connecting with others, please verify your email address.
                  </p>
                  
                  <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #6366f1; font-family: 'Courier New', monospace; margin: 8px 0; text-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);">${otp}</div>
                    <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 13px;">This code expires in <strong>${expiresInMinutes} minutes</strong></p>
                  </div>
                  
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>🔒 Security Tip:</strong> Never share this code with anyone. SAMVAAD will never ask for your OTP via phone or email.
                    </p>
                  </div>
                  
                  <p style="margin: 24px 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Once verified, you'll be able to:
                  </p>
                  
                  <table width="100%" cellpadding="8" cellspacing="0" border="0">
                    <tr>
                      <td style="color: #6366f1; font-size: 20px; vertical-align: top; width: 30px;">⚡</td>
                      <td style="color: #4b5563; font-size: 14px; line-height: 1.5;"><strong>Instant Messaging</strong> - Connect with friends in real-time</td>
                    </tr>
                    <tr>
                      <td style="color: #6366f1; font-size: 20px; vertical-align: top; width: 30px;">👥</td>
                      <td style="color: #4b5563; font-size: 14px; line-height: 1.5;"><strong>Join Communities</strong> - Discover and join channels that match your interests</td>
                    </tr>
                    <tr>
                      <td style="color: #6366f1; font-size: 20px; vertical-align: top; width: 30px;">🔒</td>
                      <td style="color: #4b5563; font-size: 14px; line-height: 1.5;"><strong>Secure & Private</strong> - Your conversations are protected end-to-end</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                    If you didn't request this code, please ignore this email.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                    © 2026 SAMVAAD. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendOtpEmail };
