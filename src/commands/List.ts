import {Message, MessageEmbed} from 'discord.js';
import Command from '../Command';

export default class List extends Command {
  name = 'list';

  description = 'List mentionable roles';

  usage = '{p}list';

  protected async internalExecute(message: Message): Promise<void> {
    const guild = message.guild!;
    const guildConfig = this.bot.getGuildConfig(guild.id);

    const embed = new MessageEmbed()
      .setTitle('Mentionable roles')
      .setDescription(
        `Use those names in the respective channels with \`${this.bot.getPrefix(
          guild.id
        )}mention [name]\`.`
      );
    Object.entries(guildConfig.channels).forEach(([id, roles]) => {
      const channelName = guild.channels.cache.get(id)?.name;
      if (!channelName || !roles) return;
      embed.addField(`#${channelName}`, roles.join(', '));
    });

    message.channel.send(embed);
  }
}
