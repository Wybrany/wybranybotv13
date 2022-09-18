import { ChannelType, Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { shuffle } from "../../utils/utils";

export default class implements Command {
    name = "trollmove";
    aliases = [];
    category = "fun";
    description = "Moves a target across multiple channels.";
    usage = "trollmove <mention> [amount <= 4]";
    permission = PermissionFlagsBits.Administrator;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        try{
            if(!message.guild) return;
            await message.delete();
            const [ target, amount ] = args;
    
            const mention = message.mentions.users.first() || message.guild.members.cache.get(target) || null;
            if(!mention) return message.error({content: "You need to tag a member or provide an id.", timed: 5000});
    
            const member = message.guild.members.cache.get(mention.id);
            if(!member) return message.error({content: `That user isn't in this server`, timed: 5000});
    
            const inChannel = member.voice.channel;
            if(!inChannel) return message.error({content: "User must be in a channel.", timed: 5000});
    
            const AvailableChannels = [...message.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== inChannel.id).values()];
            const Moves = !amount ? 4 : amount === "1" ? 2 : parseInt(amount, 10) - 1;
            const RanChannels = <number[]>shuffle(AvailableChannels.length, Moves);
    
            if(Moves && AvailableChannels.length){
                for(const channel of RanChannels){
                    await member.voice.setChannel(AvailableChannels[channel].id)
                }
                member.voice.setChannel(inChannel.id)
            }
        }catch(_){}
    }
}