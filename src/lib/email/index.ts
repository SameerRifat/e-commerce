// src/lib/email/index.ts
import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

// Verify transporter configuration
transporter.verify((error) => {
    if (error) {
        console.error('Email transporter error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

export async function sendVerificationEmail({
    email,
    url,
    token,
}: {
    email: string;
    url: string;
    token: string;
}) {
    const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #000000, #333333); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for signing up! Please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background: #000000; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #0066cc; word-break: break-all;">
            ${url}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This link will expire in 1 hour. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

    const emailText = `
    Verify Your Email
    
    Thank you for signing up! Please verify your email address by visiting:
    ${url}
    
    This link will expire in 1 hour.
    If you didn't create an account, you can safely ignore this email.
  `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Verify your email address',
            text: emailText,
            html: emailHtml,
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

export async function sendPasswordResetEmail({
    email,
    url,
    token,
}: {
    email: string;
    url: string;
    token: string;
}) {
    const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #dc2626, #ef4444); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #0066cc; word-break: break-all;">
            ${url}
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

    const emailText = `
    Reset Your Password
    
    We received a request to reset your password. Visit this link to create a new password:
    ${url}
    
    This link will expire in 1 hour.
    If you didn't request a password reset, you can safely ignore this email.
  `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Reset your password',
            text: emailText,
            html: emailHtml,
        });
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}