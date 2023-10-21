const axios = require('axios')

const webhook = {
    enabled: false,
    send: async (discordClient, content, username, channelID) => {
        if (!this.enabled) {
            return
        }

        let webhookLink

        const channel = discordClient.channels.cache.get(channelID)
        const hooks = await channel.fetchWebhooks()
        hooks.forEach((hook) => {
            if (hook.name === 'mc-chat-parser') {
                webhookLink = hook.url
            }
        })

        if (!webhookLink) {
            const hook = await channel.createWebhook({ name: 'mc-chat-parser' })
            webhookLink = hook.url
        }

        try {
            await axios.post(webhookLink, {
                content: content,
                username: username,
                avatar_url: `https://minotar.net/helm/${username}/150.png`,
            })
        }
        catch (e) {
            console.error('Error while sending webhook', e)
        }
    },
};

module.exports = { webhook }