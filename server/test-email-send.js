import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env from current directory
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') })

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

async function sendTestEmail() {
    const targetEmail = process.env.SMTP_USER // Sending to self
    console.log(`Sending test email to ${targetEmail}...`)

    try {
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.SMTP_USER}>`,
            to: targetEmail,
            subject: 'Test Email Delivery',
            text: 'This is a test email to verify the configuration is working correctly.',
            html: '<b>This is a test email</b> to verify the configuration is working correctly.',
        })

        console.log('✅ Email sent successfully!')
        console.log('Message ID:', info.messageId)
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
    } catch (err) {
        console.error('❌ Failed to send email:', err.message)
    }
}

sendTestEmail()
