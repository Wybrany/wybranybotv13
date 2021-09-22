import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { MusicConstructor, getSongInfo } from "../../methods/music/music";

export default class implements Command{
    name = "play";
    aliases = ["p"];
    category = "music";
    description = "Play.";
    usage = "music < URL | ID | SEARCH_TERM >";
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild) return deleteMessage(`Something went wrong. Please try again later.`, message);
        const search = args.join(" ");

        console.log(search)
        if(!client.guildsettings.size || !client.guildsettings.has(message.guild.id) || !client.guildsettings.get(message.guild.id)?.musicChannel){
            const guildPrefix = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id)?.prefix ?? process.env.PREFIX : process.env.PREFIX;
            return deleteMessage(`You need to create create a music channel. Use the command **${guildPrefix}music** in a channel that you want to use music at.`, message, 10000);
        }
        if(!message.member?.voice.channel) 
            return deleteMessage(`You need to be in a voicechannel to use this command.`, message, 5000);
        
        if(client.guildsettings.get(message.guild.id)?.musicChannel?.channelid !== message.channel.id)
            return deleteMessage(`You can only use this command at <#${client.guildsettings.get(message.guild.id)?.musicChannel?.channelid}>`, message, 5000)

        if(!search) return deleteMessage(`You need to give me something to search for.`, message);

        const song = await getSongInfo(search, message.author.id);
        if(!song) return deleteMessage(`I could not find any results for **${search}**`, message, 5000);
        

        
    }
}