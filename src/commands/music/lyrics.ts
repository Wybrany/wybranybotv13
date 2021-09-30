import { Message, MessageEmbed, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import lyricsFinder from "lyrics-finder";

export default class implements Command{
    name = "lyrics";
    aliases = [];
    category = "music";
    description = "Searches for lyrics on the current track.";
    usage = "lyrics <ARTISTNAME - SONGNAME>";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {
        const searchString = args.join(" ");
        const [ artistname, songname ] = searchString.split("-");
        console.log(artistname, songname);

        const lyrics = await lyricsFinder(artistname, songname);
        const title = artistname && songname ? `${artistname} - ${songname}` : artistname ? `${artistname}` : `${songname}`;
        const embed = new MessageEmbed()
            .setTitle(`Lyrics for ${title}`)
            .setColor(`BLUE`)
            .setDescription(lyrics)
            .setTimestamp()
        message.channel.send({embeds: [embed]});
    }
}