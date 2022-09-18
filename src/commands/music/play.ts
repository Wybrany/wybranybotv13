import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "play";
    aliases = ["p"];
    category = "music";
    description = "Play a song with an url. You can use Youtube, Spotify or Apple Music.";
    usage = "play <URL | Searchterm>";
    permission = PermissionFlagsBits.SendMessages;
    developerMode=false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const search = args.join(" ");

        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});

        //I should check whether it's a video url or a playlist before attempting to play this.
        const searchingMessage = await message.info({content: `Searching for "**${search}**"...`})
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue){
            try{            
                const queue = client.player?.createQueue(message.guild.id, {data: {
                    queueInitMessage: message
                }})
                await queue?.join(message.member.voice.channel);
                const song = await queue?.play(search, {requestedBy: message.author, }).catch(e => {
                    if(!guildQueue) queue.stop();
                    searchingMessage.editEmbed({content: `Oops! Something went wrong :(\n\nReason: ${e}`, timed: 10_000});
                });
                if(song)
                    await searchingMessage.editEmbed({content: `Successfully queued: **${song?.name ?? search}**.`, timed: 5000, title: `Success`, colorOverride: "Green"})

            }
            catch(e){
                searchingMessage.editEmbed({content: `Oops! Something went wrong :(\n\nReason: ${e}`, timed: 10_000});
            }
        }
        else{
            const song = await guildQueue.play(search, {requestedBy: message.author}).catch(e => {
                searchingMessage.editEmbed({content: `Oops! Something went wrong :(\n\nReason: ${e}`, timed: 10_000});
            });
            if(song)
                await searchingMessage.editEmbed({content: `Successfully queued: ${song?.name ?? search}.`, timed: 5000, title: `Success`, colorOverride: "Green"})
        }
    }
}