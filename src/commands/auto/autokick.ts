import { Message, Permissions, TextChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { Autokick } from "../../methods/auto/Autokick";

import htms from "human-to-milliseconds";
const regex = new RegExp(/(\d+[s,m,h])/, "g");

export default class implements Command{
    name = "autokick";
    aliases = [];
    category = "auto";
    description = "Autokicks a user from the server until stopped.";
    usage = "autokick <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;
    params = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        await message.delete();
        if(!args || !message.guild || !client.user) return;

        const [ user, filter ] = args;
        const mention = message.mentions.members?.first() || message.guild.members.cache.get(user) || null;
        if(!mention) return deleteMessage(`You need to mention a user.`, message, 5000);
        if(client.member_troll_list.has(mention.id)) return deleteMessage(`This member is already being autotrolled.`, message, 5000);
        if(mention.id === message.author.id) return deleteMessage(`You can't troll yourself silly!`, message, 5000);

        const channel = message.channel as TextChannel;
        const invite = await channel.createInvite({reason: `Created for autokick command.`});
        
        mention.send({content: "."})
            .then(m => {
                if(!message.guild) throw new Error("Ouch, no guild.");
                const newTrollMember = new Autokick(client, message.guild, mention, invite, m);
                newTrollMember.change_troll_state(true);
                if(regex.test(filter)) {
                    const time_ms = htms(filter) ?? null;
                    if(time_ms) newTrollMember.add_random_interval(time_ms);
                }
                else newTrollMember.add_random_interval(1000);
                newTrollMember.start_timer();
                client.member_troll_list.set(mention.id, newTrollMember);
            })
            .catch(e => {
                client.member_troll_list.delete(mention.id);
                return deleteMessage(`I failed to execute this command. Reason: User has private DMs.`, message, 10000)
            })
    }
}