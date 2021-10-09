import { Message, Permissions, TextChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { Autokick } from "src/methods/auto/Autokick";

import htms from "human-to-milliseconds";
const regex = new RegExp(/(\d+[s,m,h])/, "g");

export default class implements Command{
    name = "autokick";
    aliases = [];
    category = "auto";
    description = "Autokicks a user from the server until stopped.";
    usage = "autokick <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        await message.delete();
        if(!args || !message.guild || !client.user) return;

        const [ user, filter ] = args;
        const mention = message.mentions.members?.first() || message.guild.members.cache.get(user) || null;
        if(!mention) return deleteMessage(`You need to mention a user.`, message, 5000);
        if(client.member_troll_list.has(mention.id)) return deleteMessage(`This member is already being autotrolled.`, message, 5000);
        if(mention.id === message.author.id) return deleteMessage(`You can't troll yourself silly!`, message, 5000);

        const channel = message.channel as TextChannel;

        //Check for previous invites created with this command and resend them.
        const previousInvite = [...message.guild.invites.cache.values()];
        const invite = await channel.createInvite({reason: `Created for autokick command.`});

        mention.send(".")
            .then(() => {
                if(filter !== "once"){
                    if(!message.guild) throw new Error("Ouch, no guild.");
                    const newTrollMember = new Autokick(client, message.guild, mention, invite);
                    newTrollMember.change_troll_state(true);
                    if(regex.test(filter)) {
                        const time_ms = htms(filter) ?? null;
                        if(time_ms) newTrollMember.add_random_interval(time_ms);
                    }
                    newTrollMember.start_timer();
                    client.member_troll_list.set(mention.id, newTrollMember);
                }
            })
            .catch(e => {
                if(e === "DiscordAPIError: Cannot send messages to this user"){
                    console.warn(e);
                    client.member_troll_list.delete(mention.id);
                    return deleteMessage(`I failed to execute this command. Reason: User has private DMs.`, message, 5000)
                }
            })
    }
}