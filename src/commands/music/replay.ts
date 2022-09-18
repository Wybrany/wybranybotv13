import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "replay";
    aliases = ["restart", "rs"];
    category = "music";
    description = "Restarts the current song.";
    usage = "replay";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = false;
    params = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        try{
            await message.delete();
            if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            
            if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
            
            const guildQueue = client.player?.getQueue(message.guild.id);
            if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
    
            const song = guildQueue.replay();
            message.success({content: `Successfully replayed the song: **${song.name}**.\nIf this is a long song, this might take a while :)`, timed: 5000});
        }catch(_){}
    }
}