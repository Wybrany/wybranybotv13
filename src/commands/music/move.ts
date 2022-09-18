import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "move";
    aliases = [];
    category = "music";
    description = "Moves a song to the top of the queue.";
    usage = "move <songnumber>";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        if(!message.member?.voice?.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
        
        const [ song1 ] = args;
        if(!song1) return message.error({content: `You are missing parameters. You need to submit a songnumber.`, timed: 10000});
        
        const song1Index = parseInt(song1, 10);
        if(!Number.isInteger(song1Index) || song1Index >= guildQueue.songs.length || song1Index <= 0) 
            return message.error({content: `You did not submit a valid songnumber.`, timed: 7500});

        try{
            guildQueue.moveSong(song1Index, 1);
            message.success({content: `Successfully moved *${guildQueue.songs[1].name}* to the top of the queue.`, timed: 5000});
        }catch(_){
            message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        }        
    }
}