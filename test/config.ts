import { config } from 'dotenv'
import { join } from 'path'
import { URL } from 'url'

config({ path: join(new URL('.', import.meta.url).pathname, '.env') })

export const timeout = process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : undefined

export const token = process.env.DISCORD_TOKEN || ''
export const channelId = process.env.DISCORD_CHANNEL_ID || ''
export const webhookName = process.env.WEBHOOK_NAME || 'mc-chat-parser'

export const host = process.env.RCON_HOST || 'localhost'
export const port = parseInt(process.env.RCON_PORT || '27015')
export const pass = process.env.RCON_PASSWORD || ''
