# MentionBot

A bot to control publicly role mentioning by proxying the mentions through the bot. This is a
TypeScript minimalist rewrite of Rooskie's
[symmetrical-potato](https://github.com/GalaxySH/symmetrical-potato) which was created to solve a
mention spam issue in [CodeBullet and Co](https://discord.gg/3wTEZkh)

## How It Works

This is a very basic showcase. To see all commands use the `help` command.

Have some unmentionable role and make a mention request (`?!mention [name]`):

<img alt="showcase screenshot 1" src="https://cdn.discordapp.com/attachments/574189601338556429/771823297960738816/unknown.png" width=500 />

Wait 1 minute and then decide if you want to still mention the role:

<img alt="showcase screenshot 2" src="https://cdn.discordapp.com/attachments/574189601338556429/771824895181062154/unknown.png" width=500 />

Accept and have the role mentioned:

<img alt="showcase screenshot 3" src="https://cdn.discordapp.com/attachments/574189601338556429/771826150817005618/unknown.png" height=45 />

Or decline the confirmation:

<img alt="showcase screenshot 4" src="https://cdn.discordapp.com/attachments/574189601338556429/771827067511636039/unknown.png" width=500 />

### Features

- Restrict certain role mentions to certain channels
- Force a wait time before the mention request is accepted (or set it to 0 and not wait)
- Have one default role per channel so `[name]` can be omitted from the command
- Mod features
  - Lock server to reject all pending mention requests and prevent new ones
  - Skip vote time for pending mention requests
  - Force reject a specific mention request
  - Logging of who made a mention request and which one was granted

## Things That Could Be Improved/Added

PRs are welcome!

- Make locking via commands persistent (currently at the start only loads default from
  `config.json`)
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
