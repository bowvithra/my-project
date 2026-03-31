const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/real-auth-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Professional Email Template
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Email Templates
const emailTemplates = {
  register: (user) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f6f9fc;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Welcome to ProApp</h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your account has been created successfully!</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Hello ${user.name}! 🎉</h2>
                            <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 24px;">
                                <h3 style="color: #333; margin: 0 0 12px 0; font-size: 18px;">📋 Account Details</h3>
                                <table style="width: 100%; font-size: 15px;">
                                    <tr><td style="color: #666; padding-right: 20px;">Name:</td><td><strong>${user.name}</strong></td></tr>
                                    <tr><td style="color: #666; padding-right: 20px;">Email:</td><td><strong>${user.email}</strong></td></tr>
                                    <tr><td style="color: #666; padding-right: 20px;">Phone:</td><td><strong>${user.phone}</strong></td></tr>
                                    <tr><td style="color: #666; padding-right: 20px;">Joined:</td><td><strong>${new Date().toLocaleDateString()}</strong></td></tr>
                                </table>
                            </div>
                            <p style="color: #666; line-height: 1.6; font-size: 16px;">
                                Thank you for joining ProApp. We're excited to have you on board!
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                © 2024 ProApp. All rights reserved.<br>
                                This is an automated message. Please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `,
  
  login: (user) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f6f9fc;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Login Successful</h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Welcome back ${user.name}!</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="background: #d4edda; padding: 24px; border-radius: 12px; border-left: 4px solid #28a745; margin-bottom: 24px;">
                                <h3 style="color: #155724; margin: 0 0 12px 0; font-size: 18px;">✅ Security Notification</h3>
                                <p style="color: #155724; margin: 0; font-size: 15px;">
                                    You logged in at <strong>${new Date().toLocaleString()}</strong>
                                </p>
                            </div>
                            <p style="color: #666; line-height: 1.6; font-size: 16px;">
                                If you didn't login, please secure your account immediately.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                © 2024 ProApp. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `
};

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone, dob } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'User already exists with this email!' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword, phone, dob: new Date(dob) });
    await user.save();

    // Send Professional Email
    transporter.sendMail({
      from: `"ProApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to ProApp - Account Created Successfully!',
      html: emailTemplates.register(user)
    });

    res.json({ 
      success: true, 
      message: 'Account created successfully! 🎉 Check your email for confirmation.',
      user: { name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials!' });
    }

    // Send Login Notification
    transporter.sendMail({
      from: `"ProApp Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Login Successful - ProApp',
      html: emailTemplates.login(user)
    });

    res.json({ 
      success: true, 
      message: 'Login successful! 🔐 Check your email notification.',
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email,
        phone: user.phone 
      },
      token: 'login-success-' + Date.now() // Real JWT in production
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ProApp running on http://localhost:${PORT}`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_USER}`);
});