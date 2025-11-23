import { ImapFlow } from 'imapflow'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env from current directory
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') })

const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.hostinger.com',
    port: Number(process.env.IMAP_PORT || 993),
    secure: String(process.env.IMAP_SECURE || 'true') === 'true',
    auth: {
        user: process.env.IMAP_USER || process.env.SMTP_USER,
        pass: process.env.IMAP_PASS || process.env.SMTP_PASS,
    },
    logger: false,
})

async function checkInbox() {
    console.log('Connecting to IMAP to check for new emails...')
    try {
        await client.connect()
        await client.mailboxOpen('INBOX')
        console.log('✅ Connected to Inbox')

        // Search for the test email
        const list = await client.search({ subject: 'Test Email Delivery' })
        if (list.length > 0) {
            console.log(`✅ Found ${list.length} test email(s) in Inbox!`)
            console.log('Delivery verified.')
        } else {
            console.log('⚠️ Test email not found in Inbox yet. It might take a moment.')
        }

        await client.logout()
    } catch (err) {
        console.error('❌ IMAP Error:', err.message)
    }
}

checkInbox()
