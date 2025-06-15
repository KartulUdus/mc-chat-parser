# Minecraft Chat Parser

A Discord chat-bot that connects a specified Discord channel with a Minecraft server in-game chat,
allowing to pass messages between the two.

## Features

- Messages from a Discord channel appear in Minecraft in-game chat as:
    ```
    <username> message content
    ```
  - The username of the Discord user sending the message (not the bot) is used.
  - Color is added to the `<username>` to help distinguish it from
      other in-game chat (defaults to teal).
  - The message content supports [some emojis](https://gist.github.com/tomasdev/92bde758ee8e65fa826717b24cfd0463),
    but not all of them.

- Messages from Minecraft in-game chat appear in a Discord text channel as:
    ```
    📷 username [BOT] MM/DD/YYYY HH:MM AM/PM
    message content
    ```
    - Player username is used as the sender
    - The display image 📷 is replaced with the head of the player avatar using
      the https://minotar.net/ API together with the player username, for example:

     ![head for username](https://minotar.net/helm/username/150.png)
    - Username and timestamp format defaults to what Discord uses, the `[BOT]` label is added by Discord automatically.
    - The message content is sent as-is (e.g. `:D` will appear as text, not as 😄)

- Discord bot will indicate player presence on the server with custom status messages:
    - It will set its status to `🌙Idle` and a custom status message to `Waiting for players` when
      there are no players on the server.
    - It will set its status to `🟢Online` when there are players and set the status message to `Watching username` if
      only one player is on the server, and `Watching # players` when the number of players is `#`. In the latter case,
      the full list of online usernames is visible in the bot activity details.

## Installation

### Discord bot setup

1. Create a new bot application in the Discord Developer Portal.
2. In **Settings > Bot** use the _Reset Token_ button to generate a new token, copy that for later.
3. In **Settings > Bot > Privileged Gateway Intents** enable `PRESENCE INTENT` and `MESSAGE CONTENT INTENT` options.
4. In **Settings > OAuth2 > Url Generator** enable the scope `bot` and bot permissions `Manage Webhooks`,
    `Read Messages/View Channels`, `Send Messages`, and `Use Embedded Activities`.
5. Visit the generated URL to invite the bot into your Discord channel.
6. Copy the ID of a Discord text channel you want the bot to participate
   - enable Developer Mode (under **User Settings > Advanced**)
   - right-click on the channel to get the ID.

### Chat application setup

The bot requires [RCON access](https://wiki.vg/RCON) to a Minecraft server instance to be able to send in-game messages
and to get the list of online players, and read access to the Minecraft log file to read the in-game chat messages.

An [example compose file](./compose.example.yml) is included with the project to show how to run the bot together with
a Minecraft server instance that is leveraging the https://github.com/itzg/docker-minecraft-server docker image.
Fill in the empty env variables and run `docker compose up -d`.

Alternatively, the bot can also be executed as a stand-alone Node.js application running on the same server where your
Minecraft instance is located. Requires Node 18 or later to be present on the server.

- clone this repo,
- run `npm install`,
- run `npm run build`,
- create a `.env` file from `.env.example` and fill in the config variables in that file,
- and run `node dist/app.js`

### Configuration

- **DISCORD_TOKEN** - Discord access token generated during bot setup.
- **DISCORD_CHANNEL_ID** - Text channel ID where the bot participates.
- **DISCORD_LOGIN_TIMEOUT** - Number of milliseconds the bot waits to establish the initial Discord session. Defaults to `60000`.
- **WEBHOOK_NAME** - Pretty much an arbitrary name for the webhook. Defaults to `mc-chat-parser`.
- **RCON_PASSWORD** - Password for the Minecraft server instance RCON connection.
- **RCON_HOST** - Hostname or IP for the RCON connection. Defaults to `localhost`.
- **RCON_PORT** - Port number for the RCON connection. Defaults to `25575`.
- **SENDER_COLOR** - Color to display the `<username>` part in the in-game chat. Defaults to `#2CBAA8` (teal).
- **LOG_FILE** - Path to the Minecraft server logs file. Defaults to `/logs/latest.log`
- **TIMESTAMP_PATTERN** - Timestamp format used in Minecraft server logs file. Defaults to `\d{2}:\d{2}:\d{2}`

## Authors

- Derek Mäekask [KartulUdus](https://github.com/KartulUdus)
- Jaak Kütt [jaakkytt](https://github.com/jaakkytt)

## Licence

[ISC](https://opensource.org/license/isc-license-txt/)

## Contribution

1. Start by creating an issue https://github.com/KartulUdus/mc-chat-parser/issues.
2. Fork and modify.
3. Add/update tests (sufficiently, a subjective measure).
4. Make sure tests pass (`npm run test`).
5. Make sure ESLint passes (`npm run lint`).
6. Update the version nr in `package.json` following [Semantic Versioning 2.0.0](https://semver.org/).
7. Reference the issue nr in the branch (e.g. `feature/nr-few-words`) and commit messages.
8. Create a pull request.
