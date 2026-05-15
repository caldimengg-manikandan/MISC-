require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('🧪 Testing SMTP Configuration...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('From:', process.env.SMTP_FROM || process.env.SMTP_USER);
    console.log('Secure:', process.env.SMTP_SECURE);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully!');

        console.log('📤 Attempting to send test email...');
        await transporter.sendMail({
            from: `"CALMISC Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to yourself
            subject: 'CALMISC SMTP Test',
            text: 'If you receive this, your SMTP settings are correct.'
        });
        console.log('🚀 Test email sent successfully! Check your inbox.');
    } catch (err) {
        console.error('❌ SMTP Error:', err.message);
        if (err.message.includes('553')) {
            console.log('\n💡 TIP: The "553" error means your SMTP server requires the "From" address to be the SAME as your "User" address.');
            console.log('Please update your .env file so that SMTP_FROM matches SMTP_USER exactly.');
        }
    }
}

testEmail();
