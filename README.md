
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
    depends_on:
      game:
        condition: service_healthy
    volumes:
      - ./data/logs:/logs:ro
    environment:
      - DISCORD_TOKEN=
      - DISCORD_CHANNEL_ID=
      - RCON_HOST=game
      - RCON_PORT=25575
      - RCON_PASSWORD=
      - LOG_FILE=latest.log
```
