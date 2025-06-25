import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Check if SendGrid API key is available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailVerificationData {
  email: string;
  username: string;
  verificationToken: string;
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email verification will be skipped.');
    return false;
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${data.verificationToken}`;
  
  const msg = {
    to: data.email,
    from: 'noreply@lume-dermatology.com', // Replace with your verified sender email
    subject: 'Verify Your LUME Account Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - LUME</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d4af37, #f4e4bc); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
          .tagline { color: #666; font-size: 16px; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #d4af37, #f4e4bc); 
            color: #000; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            margin: 20px 0;
            text-align: center;
          }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LUME</div>
            <div class="tagline">Bringing Brightness</div>
          </div>
          
          <div class="content">
            <h2>Welcome to LUME, ${data.username}!</h2>
            <p>Thank you for registering with LUME, your advanced dermatology AI platform. To complete your registration and secure your account, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <h3>What's Next?</h3>
            <ul>
              <li>Complete your patient profile</li>
              <li>Upload skin images for AI analysis</li>
              <li>Get expert-validated results</li>
              <li>Schedule appointments with dermatologists</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>If you didn't create an account with LUME, please ignore this email.</p>
            <p>© 2025 LUME - Advanced Dermatology AI Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to LUME, ${data.username}!
      
      Thank you for registering with LUME. To complete your registration, please verify your email address by visiting:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with LUME, please ignore this email.
      
      © 2025 LUME - Advanced Dermatology AI Platform
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Welcome email will be skipped.');
    return false;
  }

  const msg = {
    to: email,
    from: 'noreply@lume-dermatology.com',
    subject: 'Welcome to LUME - Your Account is Verified!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to LUME</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d4af37, #f4e4bc); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { font-size: 32px; font-weight: bold; color: #000; margin-bottom: 10px; }
          .tagline { color: #666; font-size: 16px; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .feature { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #d4af37; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LUME</div>
            <div class="tagline">Bringing Brightness</div>
          </div>
          
          <div class="content">
            <h2>🎉 Email Verified Successfully!</h2>
            <p>Hello ${username},</p>
            <p>Your email has been verified and your LUME account is now fully active. You can now access all features of our advanced dermatology platform.</p>
            
            <h3>What You Can Do Now:</h3>
            
            <div class="feature">
              <h4>🔬 AI Skin Analysis</h4>
              <p>Upload skin images for instant AI-powered analysis with expert validation.</p>
            </div>
            
            <div class="feature">
              <h4>👨‍⚕️ Expert Consultation</h4>
              <p>Schedule appointments with certified dermatologists at top hospitals.</p>
            </div>
            
            <div class="feature">
              <h4>💊 Medication Management</h4>
              <p>Get prescriptions and purchase medications directly through our platform.</p>
            </div>
            
            <div class="feature">
              <h4>🤖 AI Health Assistant</h4>
              <p>Chat with our AI for personalized skincare advice and guidance.</p>
            </div>
            
            <p>Ready to get started? Log in to your account and complete your patient profile for the best experience.</p>
          </div>
          
          <div class="footer">
            <p>Need help? Contact our support team anytime.</p>
            <p>© 2025 LUME - Advanced Dermatology AI Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}