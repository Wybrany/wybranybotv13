import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { Autoname } from "../../methods/auto/Autoname";

export default class implements Command{
    name = "autoname";
    aliases = [];
    category = "auto";
    description = "Autochanges the users name until stopped.";
    usage = "autoname <@mention> <name>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;
    params = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        await message.delete();
        if(!args || !message.guild || !client.user) return;

        const [ user, name ] = args;
        const mention = message.mentions.members?.first() || message.guild.members.cache.get(user) || null;
        if(!mention || !name) return deleteMessage(`You need to mention a user.`, message, 5000);
        if(client.member_troll_list.has(mention.id)) return deleteMessage(`This member is already being autotrolled.`, message, 5000);
        if(mention.id === message.author.id) return deleteMessage(`You can't troll yourself silly!`, message, 5000);
        
        const newTrollMember = new Autoname(client, message.guild, mention, name);
        newTrollMember.change_troll_state(true);
        newTrollMember.add_random_interval(1000);
        newTrollMember.start_timer();
        client.member_troll_list.set(mention.id, newTrollMember);
    }
}