import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "pause";
    aliases = [];
    category = "music";
    description = "Pauses the current track.";
    usage = "pause";
    permission = PermissionFlagsBits.SendMessages;
    developerMode=false;
    params = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        try{
        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});

        guildQueue.setPaused(true);
        message.success({content: `Successfully paused the current track.`, timed: 5000});
        }
        catch(_){}
    }
}