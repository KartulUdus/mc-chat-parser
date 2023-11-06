require('dotenv').config()

const logFile = process.env.LOG_FILE || '/logs/latest.log'
const timestampPattern = process.env.TIMESTAMP_PATTERN || '\\d{2}:\\d{2}:\\d{2}'
const rconHost = process.env.RCON_HOST
const rconPort = process.env.RCON_PORT
const rconPassword = process.env.RCON_PASSWORD
const senderColor = process.env.SENDER_COLOR || '#2CBAA8'
const discordToken = process.env.DISCORD_TOKEN
const channelId = process.env.DISCORD_CHANNEL_ID
const webhookName = process.env.WEBHOOK_NAME || 'mc-chat-parser'

module.exports = {
	logFile,
	timestampPattern,
	rconHost,
	rconPort,
	rconPassword,
	senderColor,
	discordToken,
	channelId,
	webhookName,
}
