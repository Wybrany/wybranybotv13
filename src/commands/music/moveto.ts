import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "moveto";
    aliases = [];
    category = "music";
    description = "Moves a song to a new position";
    usage = "moveto <songnumber> <queueposition>";
    permission = PermissionFlagsBits.SendMessages;
    developerMode=false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        try{
            await message.delete();
            if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
            
            const guildQueue = client.player?.getQueue(message.guild.id);
            if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
            
            const [ song1, song2 ] = args;
            if(!song1 || !song2) return message.error({content: `You are missing parameters. You need to submit a song number and a queue position, with a space between.`, timed: 10000});
            
            const song1Index = parseInt(song1, 10);
            const song2Index = parseInt(song2, 10);
            if(!Number.isInteger(song1Index) || !Number.isInteger(song2Index) || song1Index === song2Index || song1Index >= guildQueue.songs.length || song2Index >= guildQueue.songs.length || song1Index <= 0 || song2Index <= 0) 
                return message.error({content: `You did not submit a valid song number or a valid queue position or you wrote two identical numbers.`, timed: 7500});
    
            try{
                const songs = guildQueue.moveSong(song1Index, song2Index);
                message.success({content: `Successfully moved *${songs[song2Index].name}* to position: ${song2Index}.`, timed: 5000});
            }catch(_){
                message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            }        
        }catch(_){}
    }
}