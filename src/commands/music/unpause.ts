import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "unpause";
    aliases = ["resume", "up"];
    category = "music";
    description = "Unpauses the current track.";
    usage = "unpause";
    permission = PermissionFlagsBits.SendMessages;
    developerMode=false;
    params = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        try{
            await message.delete();
            if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            const search = args.join(" ");
            
            if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
            
            const guildQueue = client.player?.getQueue(message.guild.id);
            if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
    
            guildQueue.setPaused(false);
            message.success({content: `Successfully unpaused the current track.`, timed: 5000});
        }catch(_){}
    }
}