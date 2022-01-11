import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
import { RepeatMode } from "discord-music-player";

export default class implements Command{
    name = "loop";
    aliases = [];
    category = "music";
    description = "Changes looping state. Toggles between \"No loop\", \"Loop Current Song\" or \"Loop Queue\"";
    usage = "loop";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});

        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
        switch(guildQueue.repeatMode){
            case RepeatMode.DISABLED:
                guildQueue.setRepeatMode(RepeatMode.SONG);
                message.success({content: `Successfully enabled song loop.`, timed: 5000});
            break;

            case RepeatMode.SONG:
                guildQueue.setRepeatMode(RepeatMode.QUEUE);
                message.success({content: `Successfully enabled queue loop.`, timed: 5000});
            break;

            case RepeatMode.QUEUE:
                guildQueue.setRepeatMode(RepeatMode.DISABLED);
                message.success({content: `Successfully disabled looping.`, timed: 5000});
            break;
        }
    }
}