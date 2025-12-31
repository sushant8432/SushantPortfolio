const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================
// Middleware
// ===========================

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'https://sushant-portfolio-jv1k.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting to prevent spam
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many messages sent. Please try again later.'
    }
});

// ===========================
// Nodemailer Configuration
// ===========================

const createTransporter = () => {
    // Validate environment variables
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.error('ERROR: SMTP credentials not found in environment variables!');
        console.error('Please set SMTP_EMAIL and SMTP_PASSWORD in your .env file');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false // For development; set to true in production
        }
    });
};

// ===========================
// Helper Functions
// ===========================

// Input validation
const validateContactForm = (data) => {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Valid email address is required');
    }
    
    if (!data.subject || data.subject.trim().length < 3) {
        errors.push('Subject must be at least 3 characters long');
    }
    
    if (!data.message || data.message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }
    
    // Sanitize inputs to prevent XSS
    const sanitizedData = {
        name: data.name.trim().substring(0, 100),
        email: data.email.trim().toLowerCase().substring(0, 100),
        subject: data.subject.trim().substring(0, 200),
        message: data.message.trim().substring(0, 2000)
    };
    
    return { errors, sanitizedData };
};

// Email HTML template
const createEmailHTML = (data) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #FF6B35, #004E89);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .info-row {
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                border-left: 4px solid #FF6B35;
            }
            .label {
                font-weight: bold;
                color: #FF6B35;
                margin-bottom: 5px;
            }
            .value {
                color: #2D3436;
            }
            .message-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #004E89;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 2px solid #dfe6e9;
                color: #636E72;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>💼 New Portfolio Contact Message</h1>
        </div>
        <div class="content">
            <div class="info-row">
                <div class="label">👤 Name:</div>
                <div class="value">${data.name}</div>
            </div>
            
            <div class="info-row">
                <div class="label">📧 Email:</div>
                <div class="value">${data.email}</div>
            </div>
            
            <div class="info-row">
                <div class="label">📝 Subject:</div>
                <div class="value">${data.subject}</div>
            </div>
            
            <div class="label" style="margin-top: 20px; margin-bottom: 10px;">💬 Message:</div>
            <div class="message-box">${data.message}</div>
            
            <div class="footer">
                <p>This message was sent from your portfolio contact form.</p>
                <p>Received on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// ===========================
// Routes
// ===========================

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Contact form submission route
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        // Validate input
        const { errors, sanitizedData } = validateContactForm(req.body);
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        
        // Create transporter
        const transporter = createTransporter();
        
        if (!transporter) {
            return res.status(500).json({
                success: false,
                message: 'Email service is not configured properly'
            });
        }
        
        // Email options
        const mailOptions = {
            from: `"Portfolio Contact Form" <${process.env.SMTP_EMAIL}>`,
            to: process.env.RECIPIENT_EMAIL || 'sushant.8432@gmail.com',
            replyTo: sanitizedData.email,
            subject: `Portfolio Contact: ${sanitizedData.subject}`,
            html: createEmailHTML(sanitizedData),
            text: `
Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Subject: ${sanitizedData.subject}

Message:
${sanitizedData.message}

---
Sent from portfolio contact form
${new Date().toLocaleString()}
            `
        };
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully:', info.messageId);
        console.log('📧 From:', sanitizedData.email);
        console.log('📝 Subject:', sanitizedData.subject);
        
        // Send success response
        res.status(200).json({
            success: true,
            message: 'Thank you! Your message has been sent successfully. I\'ll get back to you soon!'
        });
        
    } catch (error) {
        console.error('❌ Error sending email:', error);
        
        // Send error response
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later or contact directly via email.'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ===========================
// Start Server
// ===========================

// Only listen on port when not running on Vercel (serverless)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log('=================================');
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📧 SMTP Email: ${process.env.SMTP_EMAIL || 'Not configured'}`);
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        console.log('=================================');
        
        // Verify SMTP configuration on startup
        const transporter = createTransporter();
        if (transporter) {
            transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ SMTP Configuration Error:', error.message);
                    console.error('⚠️  Email sending will not work until SMTP is properly configured');
                } else {
                    console.log('✅ SMTP Server is ready to send emails');
                }
            });
        }
    });
}

// Export for Vercel serverless and other environments
module.exports = app;
