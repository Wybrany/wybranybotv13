import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { savefiledata } from "../../managers/backup";

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
        if(!prefix) return message.error({content: "Please submit a prefix.", timed: 5000});
        const reg = new RegExp("[A-Za-z0-9]", "g");
        if(prefix.length != 1) return message.error({content: `Your prefix can only be one character long.`, timed: 5000});
        if(reg.test(prefix)) return message.error({content: `Your prefix can only be a special character.`, timed: 5000});
        message.guild.prefix = prefix;
        message.success({content: `Sucessfully changed PREFIX => **${prefix}**`, timed: 10000});
        savefiledata(client, message.guild.id);
    }
}