import {Message, MessageEmbed, Snowflake} from 'discord.js';

import type Bot from './Bot';

export type CommandConstructor = new (bot: Bot) => Command;

export default abstract class Command {
  abstract readonly name: string;

  abstract readonly description: string;

  abstract readonly usage: string;

  protected readonly bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  async execute(message: Message, args: string): Promise<void> {
    try {
      await this.internalExecute(message, args);
    } catch (error) {
      this.sendError(
        message,
        'Unexpected error occurred. Contact the bot owner(s) if this happens repeatedly.'
      );
      console.error(`Uncaught error while executing command "${this.name}".`, error);
    }
  }

  protected abstract internalExecute(message: Message, args: string): Promise<void>;

  protected sendError(messageObject: Message, message: string): Promise<Message> {
    const embed = new MessageEmbed()
      .setTitle('❌ Error occurred')
      .setDescription(message)
      .setColor('RED')
      .setFooter(`Executioner Message ID:  ${messageObject.id}`);
    return messageObject.channel.send(embed);
  }

  protected sendReply(messageObject: Message, message: string): Promise<Message> {
    const embed = new MessageEmbed().setDescription(message);
    return messageObject.channel.send(embed);
  }

  getHelpEmbed(guildId: Snowflake): MessageEmbed {
    return new MessageEmbed()
      .setTitle(`Command \`${this.name}\``)
      .setDescription(this.description)
      .addField('Usage', this.usage.replace('{p}', this.bot.getPrefix(guildId)));
  }
}
