# MentionBot

This bot is a TypeScript minimalist rewrite of Rooskie's
[symmetrical-potato](https://github.com/GalaxySH/symmetrical-potato). All configuration has to be
done in the file `config.json` in the project root. The json schema can be found in `src/config.ts`.

## Things that could be improved

- Better queue data structure
  - Handling of request cancellation
- Better message cleanup mechanism
- Make locking via commands persistent (currently at start only loads default from `config.json`)
- Add command cooldown

## Usage

Fill out `config.json` like in following example:

```json
{
  "prefix": "?!",
  "owners": ["418112403419430915"],
  "guilds": {
    "572003799007232001": {
      "roles": {
        "test": {
          "id": "584078068809859096",
          "wait": 10000
        }
      },
      "channels": {
        "572003799007232004": ["test"]
      }
    }
  }
}
```

### Dev Environment

Add a `.env` file in the project root:

```env
DISCORD_TOKEN = [put your discord bot token here]
```

Run following commands:

```bsh
// Install dependencies
yarn

// Build project
yarn build:dev
// Or this for watching files for changes
yarn build:watch

// Run project
yarn start:dev
```

### Prod Environment

Use docker compose and run the following command:

```terminal
DISCORD_TOKEN=[put your discord bot token here] docker-compose -f docker-compose.yml up -d --build
```
