import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";

export default class implements Command{
    name = "remove";
    aliases = ["r"];
    category = "music";
    description = "Removes a song from the queue. ";
    usage = "remove <Name | Number>";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode=false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const search = args.join(" ");
        
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});

        const song = guildQueue?.songs.find(s => s.name.toLowerCase().includes(search.toLowerCase())) || guildQueue?.songs.find((s,i) => i === (parseInt(search, 10) - 1));
        if(!song) return message.error({content: `I couldn't find the track you wanted me to remove. Please try enter a number or the name of the track.`, timed: 7500});

        try{
            const index = guildQueue.songs.indexOf(song);
            guildQueue.remove(index);
            message.success({content: `Successfully removed ${song.name} from the queue.`, timed: 5000});
        }catch(_){
            message.error({content: `Something went wrong with removing the track. Please try again later.`, timed: 5000});
        }
    }
}