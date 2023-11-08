import { config } from 'dotenv'

config()

export const logFile = process.env.LOG_FILE || '/logs/latest.log'
export const timestampPattern = process.env.TIMESTAMP_PATTERN || '\\d{2}:\\d{2}:\\d{2}'

export const rconHost = process.env.RCON_HOST || 'localhost'
export const rconPort = parseInt(process.env.RCON_PORT || '27015')
export const rconPassword = process.env.RCON_PASSWORD || ''
export const senderColor = process.env.SENDER_COLOR || '#2CBAA8'

export const discordToken = process.env.DISCORD_TOKEN || ''
export const channelId = process.env.DISCORD_CHANNEL_ID || ''
export const webhookName = process.env.WEBHOOK_NAME || 'mc-chat-parser'
