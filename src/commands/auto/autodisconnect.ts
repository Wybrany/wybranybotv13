import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command {
    name = "autodisconnect";
    aliases = ["autodc"];
    category = "auto";
    description = "Autodisconnects a user from a voicechannel when joining one until stopped.";
    usage = "autodisconnect <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        await message.delete();
        if(!args || !message.guild || !client.user) return;

        const [ user, filter ] = args;
        const mention = message.mentions.members?.first() || message.guild.members.cache.get(user) || null;
    }
}