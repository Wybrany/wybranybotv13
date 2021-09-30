import { Message, Permissions, VoiceChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { MusicConstructor, getSongInfo, validate_search } from "../../methods/music/music";

export default class implements Command{
    name = "play";
    aliases = ["p"];
    category = "music";
    description = "Play.";
    usage = "music < URL | ID | SEARCH_TERM >";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode=false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        //Fixa så att den stödjer spellistor och låtar från spellistor
        //Fixa även så att botten inte kraschar när man söker efter låtar

        //Fixa även så att botten inte krashar när man har mer än 25 låtar med queuen,
        //Enkel lösning borde vara att låta botten visa max 25 låtar och de efter klipper man av
        //I framtiden borde jag fixa att man kan blöddra i queuen men knappar
        await message.delete();
        if(!message.guild || !client.user) return deleteMessage(`Something went wrong. Please try again later.`, message);
        const search = args.join(" ");

        const musicChannel = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id) : null;

        if(!client.guildsettings.size || !client.guildsettings.has(message.guild.id) || !musicChannel?.musicChannel){
            const guildPrefix = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id)?.prefix ?? process.env.PREFIX : process.env.PREFIX;
            return deleteMessage(`You need to create create a music channel. Use the command **${guildPrefix}music** in a channel dedicated specifically for music commands.`, message, 10000);
        }
        if(!message.member?.voice.channel) 
            return deleteMessage(`You need to be in a voicechannel to use this command.`, message, 5000);
        
        const permissions = message.member.voice.channel.permissionsFor(client.user);
        if(!permissions?.has("CONNECT") || !permissions.has("SPEAK"))
            return deleteMessage(`I need permissions to join and speak in your voicechannel.`, message, 5000);
        
        if(musicChannel?.musicChannel?.channelid !== message.channel.id)
            return deleteMessage(`You can only use this command at <#${client.guildsettings.get(message.guild.id)?.musicChannel?.channelid}>`, message, 5000)

        if(!search) return deleteMessage(`You need to give me something to search for.`, message);
        const validateSearch = validate_search(search);

        console.log(validateSearch);

        const songs = await getSongInfo(search, validateSearch, message.author.id);
        if(!songs || !songs.length) return deleteMessage(`I could not find any results for **${search}**`, message);

        if(!client.music.has(message.guild.id)) client.music.set(message.guild.id, new MusicConstructor(client, message.guild, musicChannel.musicChannel));

        if(!client.music.get(message.guild.id))
            return deleteMessage(`Something went wrong. Please try again later.`, message, 5000);

        if(!client.music.get(message.guild.id)?.get_current_channel()) 
            client.music.get(message.guild.id)?.set_current_channel(message.member.voice.channel as VoiceChannel);
        
        if(validateSearch === "PLAYLIST") 
            deleteMessage(`✅ Successfully added playlist **${songs[0]?.playlistname ?? "Unknown"}** with **${songs.length}** songs to the queue.`, message, 5000);
        else 
            deleteMessage(`✅ Successfully added **${songs[0].title}** to the queue.`, message, 5000);
        client.music.get(message.guild.id)?.add_queue(songs, true);
    }
}