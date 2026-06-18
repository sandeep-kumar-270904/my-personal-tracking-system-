const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const { sendEmail } = require('../utils/email');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, college, branch, gradYear, targetCompanies, placementSeasonStart } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      college,
      branch,
      gradYear,
      targetCompanies,
      placementSeasonStart,
    });

    if (user) {
      const verificationToken = user.getVerificationToken();
      await user.save({ validateBeforeSave: false });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;

      // Send Welcome & Verification Email
      await sendEmail({
        to: user.email,
        subject: 'Welcome to StudentTracker! Verify your email',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #ff6b00;">Welcome to StudentTracker, ${user.name}! 🚀</h2>
            <p>We're thrilled to have you on board. Please verify your email address to get started.</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #F97316; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Verify Email Address</a>
            <p>Here is what you can do after verification:</p>
            <ul>
              <li><strong>Track Applications:</strong> Keep all your job applications organized in one place.</li>
              <li><strong>Master DSA:</strong> Monitor your problem-solving streak.</li>
              <li><strong>Stay Alert:</strong> Never miss an upcoming contest.</li>
            </ul>
            <p>If you have any questions, reply to this email. We're here to help.</p>
            <br/>
            <p>Cheers,<br/>The StudentTracker Team</p>
          </div>
        `,
      });
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      branch: user.branch,
      gradYear: user.gradYear,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.college = req.body.college || user.college;
    user.branch = req.body.branch || user.branch;
    user.gradYear = req.body.gradYear || user.gradYear;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      college: updatedUser.college,
      branch: updatedUser.branch,
      gradYear: updatedUser.gradYear,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const crypto = require('crypto');

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #ff6b00;">Password Reset Request</h2>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #F97316; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Token',
        html: message,
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({ emailVerificationToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
// Use a placeholder or environment variable for the client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body; // Actually access_token from frontend
    
    // Fetch user info from Google using the access_token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${credential}`
      }
    });

    if (!response.ok) {
      return res.status(400).json({ message: 'Invalid Google access token' });
    }

    const payload = await response.json();
    
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token payload' });
    }

    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(20).toString('hex'), // Random dummy password
        isEmailVerified: true, // Trusted from Google
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

const githubAuth = async (req, res) => {
  try {
    const { code } = req.body;
    
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(400).json({ message: 'GitHub auth failed: ' + tokenData.error_description });
    }
    
    const accessToken = tokenData.access_token;
    
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Student-Tracker-App'
      }
    });
    const userData = await userResponse.json();
    
    if (userData.message) {
      return res.status(400).json({ message: 'GitHub user fetch failed: ' + userData.message });
    }
    
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Student-Tracker-App'
      }
    });
    const emailData = await emailResponse.json();
    
    if (!Array.isArray(emailData)) {
      return res.status(400).json({ message: 'GitHub email fetch failed: ' + (emailData.message || 'Invalid response') });
    }
    
    const primaryEmailObj = emailData.find(e => e.primary) || emailData[0];
    const email = primaryEmailObj?.email;
    
    if (!email) {
      return res.status(400).json({ message: 'GitHub email not accessible' });
    }
    
    const name = userData.name || userData.login;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(20).toString('hex'),
        isEmailVerified: true,
      });
    }
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('GitHub Auth Error:', error);
    res.status(500).json({ message: 'GitHub authentication failed' });
  }
};

const linkedinAuth = async (req, res) => {
  try {
    const { code } = req.body;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth/callback`
    });
    
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    
    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      return res.status(400).json({ message: 'LinkedIn auth failed: ' + tokenData.error_description });
    }
    
    const accessToken = tokenData.access_token;
    
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userData = await userResponse.json();
    
    const email = userData.email;
    const name = userData.name || `${userData.given_name} ${userData.family_name}`;
    
    if (!email) {
      return res.status(400).json({ message: 'LinkedIn email not accessible' });
    }
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(20).toString('hex'),
        isEmailVerified: true,
      });
    }
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('LinkedIn Auth Error:', error);
    res.status(500).json({ message: 'LinkedIn authentication failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleAuth,
  githubAuth,
  linkedinAuth,
};
