import {Guild, Message, MessageEmbed} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class Help extends Command {
  name = 'help';

  description = 'Helps you with documentation';

  usage = '{p}help\n{p}help [command name]';

  protected async internalExecute(
    data: GuildData,
    guild: Guild,
    message: Message,
    args: string
  ): Promise<void> {
    if (args) {
      const command = this.bot.commands.get(args);
      if (!command) {
        await this.sendError(message, `There is no command with the name \`${args}\``);
        return;
      }
      await message.channel.send(command.getHelpEmbed(data));
      return;
    }
    const embed = new MessageEmbed().setTitle('Commands');
    this.bot.commands.forEach((command, name) =>
      embed.addField(`${data.prefix}${name}`, command.description)
    );
    await message.channel.send(embed);
  }
}
