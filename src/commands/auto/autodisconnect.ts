import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command{
    name = "autodisconnect";
    aliases = ["autodc"];
    category = "auto";
    description = "Autodisconnects a user from a voicechannel when joining one until stopped.";
    usage = "autodisconnect <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {

    }
}