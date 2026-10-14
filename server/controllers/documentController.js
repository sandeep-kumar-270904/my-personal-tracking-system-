const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resume = require('../models/Resume');
const Offer = require('../models/Offer');

/**
 * Validates authentication via Authorization header or signed ?token= query parameter.
 * Used for secure file streaming where browsers open PDFs in iframes/tabs.
 */
async function authenticateDocumentRequest(req) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (err) {
    return null;
  }
}

/**
 * Secure document retrieval with authorization checks and path traversal protection.
 * Replaces unauthenticated public express.static('/uploads') exposure.
 */
exports.serveSecureDocument = async (req, res) => {
  try {
    const { type, filename } = req.params;

    // 1. Authenticate user
    const user = await authenticateDocumentRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Authentication required to access documents.' });
    }

    // 2. Prevent path traversal attacks
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid document filename.' });
    }

    const allowedTypes = ['resumes', 'offers'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document category.' });
    }

    const baseUploadDir = path.resolve(__dirname, '..', 'uploads', type);
    const targetFilePath = path.resolve(baseUploadDir, filename);

    // Verify file stays within base directory
    if (!targetFilePath.startsWith(baseUploadDir)) {
      return res.status(403).json({ message: 'Access denied: Directory traversal detected.' });
    }

    // 3. Authorization & Ownership verification
    let isAuthorized = user.role === 'admin';

    if (!isAuthorized) {
      if (type === 'resumes') {
        const resumeDoc = await Resume.findOne({ filename, user: user._id });
        if (resumeDoc) isAuthorized = true;
      } else if (type === 'offers') {
        const offerDoc = await Offer.findOne({ 
          userId: user._id, 
          offer_document_url: { $regex: filename } 
        });
        if (offerDoc) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Unauthorized: You do not have permission to access this document.' });
    }

    // 4. Verify file existence on disk
    if (!fs.existsSync(targetFilePath)) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // 5. Send file with strict security headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

    const stream = fs.createReadStream(targetFilePath);
    stream.on('error', (streamErr) => {
      console.error('File stream error:', streamErr);
      if (!res.headersSent) res.status(500).json({ message: 'Failed to read document.' });
    });
    stream.pipe(res);
  } catch (error) {
    console.error('Secure Document Error:', error);
    res.status(500).json({ message: 'Server error retrieving document.' });
  }
};

/**
 * Generates a short-lived signed access URL for a specific document.
 */
exports.generateSignedUrl = async (req, res) => {
  try {
    const { type, filename } = req.body;
    if (!type || !filename) {
      return res.status(400).json({ message: 'type and filename are required.' });
    }

    // Verify ownership before signing
    let isAuthorized = req.user.role === 'admin';
    if (!isAuthorized) {
      if (type === 'resumes') {
        const resumeDoc = await Resume.findOne({ filename, user: req.user._id });
        if (resumeDoc) isAuthorized = true;
      } else if (type === 'offers') {
        const offerDoc = await Offer.findOne({ userId: req.user._id, offer_document_url: { $regex: filename } });
        if (offerDoc) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'You do not own this document.' });
    }

    // Generate 15-minute signed token
    const token = jwt.sign(
      { id: req.user._id, filename, type },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const protocol = req.protocol;
    const host = req.get('host');
    const signedUrl = `${protocol}://${host}/api/documents/${type}/${filename}?token=${token}`;

    res.json({
      signedUrl,
      expiresIn: 900 // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Sign URL error:', error);
    res.status(500).json({ message: 'Failed to generate signed document URL.' });
  }
};
