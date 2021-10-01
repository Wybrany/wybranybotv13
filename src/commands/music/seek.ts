import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
//@ts-ignore
import htms from "human-to-milliseconds";

export default class implements Command{
    name = "seek";
    aliases = [];
    category = "music";
    description = "Seeks to a timestamp on a song that\'s current playing";
    usage = "seek <timestamp>, eg 1m20s or 20s";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();

        if(!message.guild || !message.member || !client.user) 
            return deleteMessage(`Something went wrong. Please try again later.`, message);
            
        const [ input ] = args;
        console.log(input);
        const time_ms = htms(input) as string | undefined ?? null;
        console.log(time_ms)
        const time_in_seconds = time_ms ? Math.floor((parseFloat(time_ms) / 1000)) : null;
        if(!time_in_seconds || !Number.isInteger(time_in_seconds)) return deleteMessage(`You did not give me a proper timestamp. See following examples: **1m20s** or **20s**`, message, 5000);

        if(!client.music.has(message.guild.id))
            return deleteMessage(`I need to be playing music to use this command.`, message);

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
            return deleteMessage(`You can only use this command at <#${client.guildsettings.get(message.guild.id)?.musicChannel?.channelid}>`, message, 5000);

        client.music.get(message.guild.id)?.seek(time_in_seconds);

    }
}