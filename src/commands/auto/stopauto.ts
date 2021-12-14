import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
import { Autoclass_Interface, Autokick_Interface } from "src/interfaces/auto.interface";

const find_user_by_name = (client: Modified_Client, user: string) => {
    const arrayify_troll_list = [...client.member_troll_list.values()];
    const found_member = arrayify_troll_list.find(m => `${m.target.user.username}#${m.target.user.discriminator}`.toLowerCase().includes(user.toLowerCase()));
    return found_member ? { id: found_member.target.user.id } : false;
}

export default class implements Command{
    name = "stopauto";
    aliases = [];
    category = "auto";
    description = "Stops current autocommand on a user";
    usage = "stop <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;
    params = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        await message.delete();
        if(!args || !message.guild || !client.user) return;

        const [ user ] = args;
        const mention = message.mentions.members?.first() || message.guild.members.cache.get(user) || find_user_by_name(client, user) || { id: user } || null;
        if(!mention) return message.error({content: `You need to mention a user.`, timed: 5000});
        if(client.member_troll_list.has(mention.id)) return message.error({content: `This member is already being autotrolled.`, timed: 5000});
        if(mention.id === message.author.id) return message.error({content: `You can't troll yourself silly!`, timed: 5000});
        const trolled = client.member_troll_list.get(mention.id) as Autoclass_Interface;
        trolled.stop_timer();

        if(message.guild.members.cache.has(mention.id) && trolled.state === "KICK"){
            const troll = trolled as Autokick_Interface;
            await troll.give_back_roles();
            client.member_troll_list.delete(mention.id);
        } else {
            const troll = trolled as Autokick_Interface;
            troll.give_roles_back = true;
        }
        
        if(!["KICK"].includes(trolled.state)) client.member_troll_list.delete(mention.id);
        message.error({content: `Sucessfully stopped trolling => ${trolled.target.user.username} (${trolled.target.user.id})`, timed: 5000});
    }
}