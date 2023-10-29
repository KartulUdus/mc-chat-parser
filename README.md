
# Build image

```sh
docker build -t kartuludus/minecraft-discord-chat-parser:latest .
```

# Example usage via compose

```
services:
  game:
    image: itzg/minecraft-server:latest
    volumes:
      - ./data:/data
    environment:
      - ENABLE_RCON=true
      - RCON_PASSWORD=
  chat-parser:
    image: kartuludus/minecraft-discord-chat-parser:latest
    restart: on-failure:10
    depends_on:
      game:
        condition: service_healthy
    volumes:
      - ./data/logs:/logs:ro
    environment:
      - DISCORD_TOKEN=
      - DISCORD_CHANNEL_ID=
      - WEBHOOK_NAME=mc-chat-parser
      - RCON_PASSWORD=
      - RCON_HOST=game
      - RCON_PORT=25575
      - LOG_FILE=/logs/latest.log
      - TIMESTAMP_PATTERN=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}
```
