import { Message, MessageEmbed, Collection, GuildMember, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { shuffle } from "../../methods/shuffle";

export default class implements Command {
    name = "move";
    aliases = [];
    category = "fun";
    description = "Moves a target across multiple channels.";
    usage = "move <mention> [amount <= 4]";
    permission = Permissions.FLAGS.MANAGE_CHANNELS;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        if(!message.guild) return;
        await message.delete();
        const [ target, amount ] = args;

        const mention = message.mentions.users.first() || message.guild.members.cache.get(target) || null;
        if(!mention) return message.reply({content: "You need to tag a member or provide an id."});

        const member = message.guild.members.cache.get(mention.id);
        if(!member) return message.reply({content: `That user isn't in this server`});

        const inChannel = member.voice.channel;
        if(!inChannel) return message.reply({content: "User must be in a channel."});

        const AvailableChannels = [...message.guild.channels.cache.filter(c => c.type === "GUILD_VOICE" && c.id !== inChannel.id).values()];
        const Moves = !amount ? 4 : amount === "1" ? 2 : parseInt(amount, 10) - 1;
        const RanChannels = await <number[]>shuffle(AvailableChannels.length, Moves);

        if(Moves && AvailableChannels.length){
            for(const channel of RanChannels){
                await member.voice.setChannel(AvailableChannels[channel].id)
            }
            member.voice.setChannel(inChannel.id)
        }
    }
}