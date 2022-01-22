import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "swap";
    aliases = [];
    category = "music";
    description = "Swap places with two songs.";
    usage = "swap queuenumber1 queuenumber2";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode=false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const [ song1, song2 ] = args;
        if(!song1 || !song2) return message.error({content: `You are missing parameters. You need to submit two queue numbers, with a space between.`, timed: 10000});
        const song1Index = parseInt(song1, 10);
        const song2Index = parseInt(song2, 10);
        if(!Number.isInteger(song1Index) || !Number.isInteger(song2Index) || song1Index === song2Index) 
            return message.error({content: `You did not submit two queue numbers, or you wrote two identical numbers.`, timed: 7500});
        
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});

        try{
            guildQueue.swapSongs(song1Index, song2Index);
            message.success({content: `Successfully swapped *${guildQueue.songs[song1Index].name}* and ${guildQueue.songs[song2Index].name}.`, timed: 5000});
        }catch(_){
            message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        }        
    }
}