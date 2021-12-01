import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { Automove } from "../../methods/auto/Automove";

import htms from "human-to-milliseconds";
const regex = new RegExp(/(\d+[s,m,h])/, "g");

export default class implements Command{
    name = "automove";
    aliases = [];
    category = "auto";
    description = "Automoves a user to different channels until stopped.";
    usage = "automove <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        await message.delete();
        if(!args || !message.guild || !client.user) return;

        const [ user, filter ] = args;
        const mention = message.mentions.members?.first() || message.guild.members.cache.get(user) || null;
        if(!mention) return deleteMessage(`You need to mention a user.`, message, 5000);
        if(client.member_troll_list.has(mention.id)) return deleteMessage(`This member is already being autotrolled.`, message, 5000);
        if(mention.id === message.author.id) return deleteMessage(`You can't troll yourself silly!`, message, 5000);

        const newTrollMember = new Automove(client, message.guild, mention);
        newTrollMember.change_troll_state(true);
        if(regex.test(filter)) {
            const time_ms = htms(filter) ?? null;
            if(time_ms) newTrollMember.add_random_interval(time_ms);
        }
        else newTrollMember.add_random_interval(1000);
        if(mention?.voice?.channel) newTrollMember.start_timer(mention.voice.channel);
        client.member_troll_list.set(mention.id, newTrollMember);
    }
}