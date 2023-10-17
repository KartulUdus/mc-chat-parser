const axios = require('axios')
const webhookHandler = async (discordClient, content, username, channelID) => {
    let webhookLink

    const channel = discordClient.channels.cache.get(channelID)
    const hooks = await channel.fetchWebhooks()
    hooks.forEach((hook) => {
        if (hook.name === 'mc-chat-parser') webhookLink = hook.url
    })

    if (!webhookLink){
        const hook = await msg.channel.createWebhook('mc-chat-parser')
        webhookLink = hook.url
    }

    try{
        await axios.post(webhookLink, {
            content: content,
            username: username,
            avatar_url: `https://minotar.net/helm/${username}/150.png`,
        })
    } catch(e) {
        console.error('Error while sending webhook', e)
    }

}

module.exports = { webhookHandler }