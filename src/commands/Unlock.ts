import {Message} from 'discord.js';
import Command from '../Command';

export default class Unlock extends Command {
  name = 'unlock';

  description = 'Unlocks guild';

  usage = '{p}unlock';

  protected async internalExecute(message: Message, args: string): Promise<void> {
    const member = message.member!;
    if (!this.bot.isMemberController(member)) return;

    const guild = message.guild!;
    const guildConfig = this.bot.getGuildConfig(guild.id);

    if (!guildConfig.locked) {
      await this.sendError(message, `Guild is already unlocked.`);
      return;
    }

    guildConfig.locked = false;
    await this.sendReply(message, 'Guild has been unlocked.');
  }
}
