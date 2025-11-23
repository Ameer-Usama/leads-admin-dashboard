import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env from current directory
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') })

const config = {
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || 'true') === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    },
    imap: {
        host: process.env.IMAP_HOST || 'imap.hostinger.com',
        port: Number(process.env.IMAP_PORT || 993),
        secure: String(process.env.IMAP_SECURE || 'true') === 'true',
        auth: {
            user: process.env.IMAP_USER || process.env.SMTP_USER,
            pass: process.env.IMAP_PASS || process.env.SMTP_PASS,
        },
    },
}

async function testSMTP() {
    console.log('Testing SMTP...')
    console.log('Config:', { ...config.smtp, auth: { user: config.smtp.auth.user, pass: '****' } })
    try {
        const transporter = nodemailer.createTransport(config.smtp)
        await transporter.verify()
        console.log('✅ SMTP Connection Successful')
        return true
    } catch (err) {
        console.error('❌ SMTP Connection Failed:', err.message)
        return false
    }
}

async function testIMAP() {
    console.log('\nTesting IMAP...')
    console.log('Config:', { ...config.imap, auth: { user: config.imap.auth.user, pass: '****' } })
    const client = new ImapFlow({
        host: config.imap.host,
        port: config.imap.port,
        secure: config.imap.secure,
        auth: config.imap.auth,
        logger: false,
    })

    try {
        await client.connect()
        console.log('✅ IMAP Connection Successful')
        await client.logout()
        return true
    } catch (err) {
        console.error('❌ IMAP Connection Failed:', err.message)
        return false
    }
}

async function run() {
    const smtpOk = await testSMTP()
    const imapOk = await testIMAP()

    if (smtpOk && imapOk) {
        console.log('\n🎉 All email configurations are working correctly!')
        process.exit(0)
    } else {
        console.error('\n⚠️ Some configurations failed.')
        process.exit(1)
    }
}

run()
