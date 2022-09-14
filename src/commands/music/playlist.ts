import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "playlist";
    aliases = ["pl"];
    category = "music";
    description = "Play a playlist. You can use Youtube, Spotify or Apple Music.";
    usage = "play <URL>";
    permission = PermissionFlagsBits.SendMessages;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const search = args.join(" ");

        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});

        //I should check whether it's a video url or a playlist before attempting to play this.
        const searchingMessage = await message.info({content: `Searching for "**${search}**"... If this is a long playlist, this might take a while. Have patience!!`})
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue){
            try{            
                const queue = client.player?.createQueue(message.guild.id, {data: {
                    queueInitMessage: message
                }})
                await queue?.join(message.member.voice.channel);
                const playlist = await queue?.playlist(search, {requestedBy: message.author}).catch(_ => {
                    if(!guildQueue) queue.stop();
                    searchingMessage.editEmbed({content: `Something went wrong with playing that song, please try again later.`, timed: 5000});
                });
                if(playlist)
                    await searchingMessage.editEmbed({content: `Successfully queued: **${playlist?.name ?? search} | ${playlist?.author ?? "Unknown Author"} with ${playlist?.songs?.length ?? "Unknown number of "} tracks**.`, timed: 5000, title: `Success`, colorOverride: "Green"})
            }
            catch(_){
                searchingMessage.editEmbed({content: `Something went wrong with playing that song, please try again later.`, timed: 5000});
            }
        }
        else{
            const playlist = await guildQueue.playlist(search, {requestedBy: message.author}).catch(_ => {
                searchingMessage.editEmbed({content: `Something went wrong with playing that song, please try again later.`, timed: 5000});
            });
            if(playlist)
                await searchingMessage.editEmbed({content: `Successfully queued: **${playlist?.name ?? search} | ${playlist?.author ?? "Unknown Author"} with ${playlist?.songs?.length ?? "Unknown number of "} tracks**.`, timed: 5000, title: `Success`, colorOverride: "Green"})
        }
    }
}