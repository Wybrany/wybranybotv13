import { Message, MessageEmbed, Collection, GuildMember, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { savefiledata } from "../../methods/backup";

export default class implements Command{
    name = "setprefix";
    aliases = ["sp"];
    category = "misc";
    description = "Change the current prefix to something else.";
    usage = "settings <category> <value>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        if(!message.guild) return;
        const [ prefix ] = args;
        //Fixa en lista
        if(!prefix) return message.reply({content: "Please submit a prefix."});
        const reg = new RegExp("[A-Za-z0-9]", "g");
        if(prefix.length != 1) return message.reply({content: `Your prefix can only be one character long.`});
        if(reg.test(prefix)) return message.reply({content: `Your prefix can only be a special character.`});
        const previousSettings = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id) : {};
        const combined = { ...previousSettings, guildid: message.guild.id, prefix };
        client.guildsettings.set(message.guild.id, combined);
        message.reply({content: `Sucessfully changed PREFIX => **${prefix}**`});
        savefiledata(client, message.guild.id);
    }
}