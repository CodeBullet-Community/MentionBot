import Bot from './Bot';
import {BotConfig} from './config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('console-stamp')(console);

function exitWithError(): never {
  console.info('Exiting with code 1.');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection from Promise.', reason, promise);
});
process.on('uncaughtException', error => {
  console.error('Uncaught Exception thrown.', error);
  exitWithError();
});

let config: BotConfig;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  config = require('../config.json');
  if (Object.keys(config).length !== 3) throw new Error('Config file is incomplete');
} catch (error) {
  console.error('Caught error while loading config file.', error);
  exitWithError();
}

const bot = new Bot(config);
bot.initializeBot().catch(error => {
  console.error('Uncaught Exception thrown while initializing bot.', error);
  exitWithError();
});
