import {Guild, Message, MessageEmbed} from 'discord.js';
import Command from '../Command';
import GuildData from '../GuildData';

export default class List extends Command {
  name = 'list';

  description = 'List mentionable roles';

  usage = '{p}list';

  protected async internalExecute(data: GuildData, guild: Guild, message: Message): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle('Mentionable roles')
      .setDescription(
        `Use those names in the respective channels with \`${data.prefix}mention [name]\`.`
      );
    data.channels.forEach((roles, id) => {
      const channelName = guild.channels.cache.get(id)?.name;
      if (!channelName || !roles) return;
      embed.addField(`#${channelName}`, roles.join(', '));
    });
    message.channel.send(embed);
  }
}
