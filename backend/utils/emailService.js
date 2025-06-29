const nodemailer = require('nodemailer');

// Create transporter for sending emails
const createTransporter = async () => {
  try {
    console.log('📧 Creating email transporter...');
    
    // For development, always use test account
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      console.log('📧 Creating test email account for development...');
      
      try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('✅ Test account created:', testAccount.user);
        
        const transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        console.log('✅ Test transporter created successfully');
        return transporter;
      } catch (testError) {
        console.error('❌ Failed to create test account:', testError);
        throw new Error('Failed to create test email account: ' + testError.message);
      }
    }
    
    // For production, use real email service
    return nodemailer.createTransporter({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('❌ Error creating email transporter:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    console.log('📧 Preparing to send password reset email to:', email);
    
    const transporter = await createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Socialee Support" <noreply@socialee.com>',
      to: email,
      subject: 'Reset Your Socialee Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f5f5f5; 
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
            }
            .header { 
              background: linear-gradient(135deg, #FF2E93, #6F2DFF); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 700; 
            }
            .header p { 
              margin: 10px 0 0 0; 
              opacity: 0.9; 
              font-size: 16px; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .content h2 { 
              color: #333; 
              margin: 0 0 20px 0; 
              font-size: 24px; 
            }
            .content p { 
              margin: 0 0 20px 0; 
              color: #666; 
              font-size: 16px; 
            }
            .button { 
              display: inline-block; 
              background: #FF2E93; 
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600; 
              font-size: 16px; 
              margin: 20px 0; 
              transition: background-color 0.3s ease; 
            }
            .button:hover { 
              background: #e0267d; 
            }
            .link-box { 
              background: #f8f9fa; 
              border: 1px solid #e9ecef; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 20px 0; 
              word-break: break-all; 
              font-family: monospace; 
              font-size: 14px; 
              color: #495057; 
            }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            .warning h3 { 
              margin: 0 0 10px 0; 
              color: #856404; 
              font-size: 18px; 
            }
            .warning ul { 
              margin: 10px 0 0 0; 
              padding-left: 20px; 
            }
            .warning li { 
              margin: 8px 0; 
              color: #856404; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 30px; 
              text-align: center; 
              border-top: 1px solid #e9ecef; 
            }
            .footer p { 
              margin: 0 0 10px 0; 
              color: #6c757d; 
              font-size: 14px; 
            }
            .steps { 
              background: #f8f9fa; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            .steps h3 { 
              margin: 0 0 15px 0; 
              color: #333; 
              font-size: 18px; 
            }
            .steps ol { 
              margin: 0; 
              padding-left: 20px; 
            }
            .steps li { 
              margin: 8px 0; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>Socialee Account Recovery</p>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>We received a request to reset the password for your Socialee account associated with <strong>${email}</strong>.</p>
              
              <p>If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-box">${resetUrl}</div>
              
              <div class="warning">
                <h3>⚠️ Important Security Information</h3>
                <ul>
                  <li>This link will expire in <strong>15 minutes</strong> for your security</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                  <li>Our team will never ask for your password via email</li>
                </ul>
              </div>
              
              <div class="steps">
                <h3>Having trouble with the button?</h3>
                <p>You can also reset your password by:</p>
                <ol>
                  <li>Going to the Socialee login page</li>
                  <li>Clicking "Forgot Password"</li>
                  <li>Entering your username and email</li>
                </ol>
              </div>
            </div>
            <div class="footer">
              <p>This email was sent from Socialee.</p>
              <p>If you have any questions, please contact our support team.</p>
              <p>© 2025 Socialee. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${userName}!

We received a request to reset the password for your Socialee account (${email}).

If you made this request, please visit the following link to reset your password:
${resetUrl}

This link will expire in 15 minutes for your security.

If you didn't request this password reset, please ignore this email.

Best regards,
The Socialee Team
      `
    };

    console.log('📤 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Password reset email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
    // For development with test accounts, get the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('🔗 Preview URL:', previewUrl);
      console.log('📧 IMPORTANT: Click this link to view the email:', previewUrl);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl
    };
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// Test email service
const testEmailService = async () => {
  try {
    console.log('🧪 Testing email service...');
    const transporter = await createTransporter();
    
    console.log('🔍 Verifying transporter...');
    const verified = await transporter.verify();
    console.log('✅ Email service verification result:', verified);
    
    return verified;
  } catch (error) {
    console.error('❌ Email service test failed:', error);
    console.error('Test error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  testEmailService
};