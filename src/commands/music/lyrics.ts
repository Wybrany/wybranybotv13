import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
//@ts-ignore
import lyricsFinder from "lyrics-finder";

export default class implements Command{
    name = "lyrics";
    aliases = [];
    category = "music";
    description = "Searches for lyrics on the current track.";
    usage = "lyrics <ARTISTNAME - SONGNAME>";
    permission = PermissionFlagsBits.SendMessages;
    params = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});

        if(!message.member?.voice.channel) 
            return message.error({content: `You need to be in a voicechannel to use this command.`, timed: 5000});

        const searchString = args.join(" ");
        let [ artistname, songname ] = searchString.split("-");
        const queue = client.player?.getQueue(message.guild.id);

        if(!artistname || !songname) {
            if(!queue) return message.error({content: `No track is currently playing or you did not submit an **Artistname - Songname**`, timed: 10000});
            [artistname, songname] = [queue.nowPlaying?.name.split("-")[0] ?? queue.nowPlaying?.author ?? "", queue.nowPlaying?.name.split("-")[1] ?? ""];
            if(!artistname || !songname) artistname = queue.nowPlaying?.name ?? "";
        }

        const lyrics = await lyricsFinder(artistname, songname);
        const title = artistname && songname ? `${artistname} - ${songname}` : artistname ? `${artistname}` : `${songname}`;
        if(!lyrics) return message.error({content: `I could not find any lyrics. Please be more accurate with your submission! Try **Artistname - Songname**`, timed: 10000});
        const embed = new EmbedBuilder()
            .setTitle(`Lyrics for ${title}`)
            .setColor("Blue")
            .setDescription(lyrics)
            .setTimestamp()

        const lyricsEmbed = await message.channel.send({embeds: [embed]});

        if(queue && queue.nowPlaying && queue.connection){
            const { time } = queue.connection;
            const { milliseconds, seekTime } = queue.nowPlaying;
            const remainingTime = milliseconds - (time + seekTime);
            setTimeout(async () => await lyricsEmbed.delete().catch(_ => _), remainingTime);
        }
    }
}