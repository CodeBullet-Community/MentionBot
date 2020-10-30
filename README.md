# MentionBot

A bot to control publicly role mentioning by proxying the mentions through the bot. This is a
TypeScript minimalist rewrite of Rooskie's
[symmetrical-potato](https://github.com/GalaxySH/symmetrical-potato) which was originally created to
solve a mention spam issue in [CodeBullet and Co](https://discord.gg/3wTEZkh)

## Currently Implemented Mention Restrictions

- Allow certain role mentions only in certain channels
- Force a wait time before the Mention Request is accepted
- Lock the entire guild via one guild

## Things That Could Be Improved/Added

- Make locking via commands persistent (currently at start only loads default from `config.json`)
- Add command cooldown
- Make wait time relative to the last message the user sent in the channel with some minimum wait
  time and some threshold when normal wait times apply again

## Usage

Fill out `config.json` like in the following example:

```jsonc
{
  "prefix": "??", // default
  "owners": [], // default | list of user ids
  "guilds": {
    // guild id
    "5720037990072332001": {
      "locked": false, // default
      "prefix": "??", // default is global prefix
      "confirmReactionTime": 60000, // default | time to confirm mention request
      "controllers": [], // default | list of user ids
      "roles": {
        // arbitrary name for role
        "test": {
          "id": "584072368809859096",
          "wait": 10000 // in milliseconds
        }
      },
      "channels": {
        // channel id
        "572002399007232004": ["test"],
        // or with custom default (default would be first role in array)
        "572003799007232132": {
          "roles": ["test"],
          "default": null // name of role in "roles" array or null for none
        }
      }
    }
  }
}
```

Note: Fields commented with default contain the default value and are optional.

### Dev Environment

Add a `.env` file in the project root:

```env
DISCORD_TOKEN = [put your discord bot token here]
```

Run the following commands:

```bsh
// Install dependencies
yarn

// Build project
yarn build:dev
// Or this to also watch files for changes
yarn build:watch

// Run project
yarn start:dev
```

### Prod Environment

Use docker-compose and run the following command:

```terminal
DISCORD_TOKEN=[put your discord bot token here] docker-compose -f docker-compose.yml up -d --build
```
