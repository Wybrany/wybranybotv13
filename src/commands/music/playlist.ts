import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";

export default class implements Command{
    name = "playlist";
    aliases = ["pl"];
    category = "music";
    description = "Play a playlist. You can use Youtube, Spotify or Apple Music.";
    usage = "play <URL>";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const search = args.join(" ");

        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});

        //I should check whether it's a video url or a playlist before attempting to play this.
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue){
            try{            
                const queue = client.player?.createQueue(message.guild.id)
                await queue?.join(message.member.voice.channel);
                const song = await queue?.playlist(search, {requestedBy: message.author}).catch(_ => {
                    if(!guildQueue) queue.stop();
                    message.error({content: `Something went wrong with playing that song, please try again later.`, timed: 5000});
                });
            }
            catch(_){
                message.error({content: `Something went wrong with playing that song, please try again later.`, timed: 5000});
            }
        }
        else{
            guildQueue.playlist(search, {requestedBy: message.author}).catch(_ => {
                message.error({content: `Something went wrong with playing that song, please try again later.`, timed: 5000});
            });
        }
    }
}