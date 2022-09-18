import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { RepeatMode } from "../../player/index";

const repeatmodeMap = {
    "none": 0,
    "disable": 0,
    "song": 1,
    "loop": 1,
    "queue": 2
}

const responseMap = {
    0: "Successfully disabled looping.",
    1: "Successfully enabled song loop.",
    2: "Successfully enabled queue loop."
}

export default class implements Command{
    name = "loop";
    aliases = [];
    category = "music";
    description = "Changes looping state. Toggles between \"No loop\", \"Loop Current Song\" or \"Loop Queue\"";
    usage = "loop";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = false;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {
        try{
            await message.delete();
            if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
    
            const guildQueue = client.player?.getQueue(message.guild.id);
            if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
    
            const input = args.join(" ");
    
            if(input){
                const repeatMode: RepeatMode = repeatmodeMap?.[input];
                if(repeatMode || repeatMode === 0) {
                    guildQueue.setRepeatMode(repeatMode);
                    message.success({content: responseMap[repeatMode]});
                    return;
                }
            }
    
            guildQueue.repeatMode === RepeatMode.DISABLED ? guildQueue.setRepeatMode(RepeatMode.SONG) 
                : guildQueue.repeatMode === RepeatMode.SONG ? guildQueue.setRepeatMode(RepeatMode.QUEUE)
                : guildQueue.setRepeatMode(RepeatMode.DISABLED);
    
            message.success({content: responseMap[guildQueue.repeatMode], timed: 5000});
        }catch(_){}
    }
}