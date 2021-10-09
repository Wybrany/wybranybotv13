import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command{
    name = "autoname";
    aliases = [];
    category = "auto";
    description = "Autochanges the users name until stopped.";
    usage = "autoname <@mention> <name>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {

    }
}