import { Message, MessageEmbed, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import lyricsFinder from "lyrics-finder";

export default class implements Command{
    name = "lyrics";
    aliases = [];
    category = "music";
    description = "Searches for lyrics on the current track.";
    usage = "lyrics <ARTISTNAME - SONGNAME>";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    params = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return deleteMessage(`Something went wrong. Please try again later.`, message);

        if(!message.member?.voice.channel) 
            return deleteMessage(`You need to be in a voicechannel to use this command.`, message, 5000);

        const searchString = args.join(" ");
        let [ artistname, songname ] = searchString.split("-");
        if(!artistname || songname) {
            if(!client.music.has(message.guild?.id)) return deleteMessage(`No track is currently playing or you did not submit an **Artistname - Songname**`, message, 3000);
            artistname = client.music.get(message.guild.id)?.current_song?.title || "";
            if(!artistname) return deleteMessage(`No track is currently playing or you did not submit an **Artistname - Songname**`, message, 3000);
        }
        const lyrics = await lyricsFinder(artistname, songname);
        const title = artistname && songname ? `${artistname} - ${songname}` : artistname ? `${artistname}` : `${songname}`;
        if(!lyrics) return deleteMessage(`I could not find any lyrics. Please be more accurate with your submission! Try **Artistname - Songname**`, message, 3000);
        const embed = new MessageEmbed()
            .setTitle(`Lyrics for ${title}`)
            .setColor(`BLUE`)
            .setDescription(lyrics)
            .setTimestamp()
        message.channel.send({embeds: [embed]});
    }
}