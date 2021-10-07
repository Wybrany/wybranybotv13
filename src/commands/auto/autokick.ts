import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command{
    name = "autokick";
    aliases = [];
    category = "auto";
    description = "Autokicks a user from the server until stopped.";
    usage = "autokick <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {

    }
}