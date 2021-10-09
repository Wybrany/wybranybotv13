import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command{
    name = "automute";
    aliases = [];
    category = "auto";
    description = "Automutes a user when speaking until stopped.";
    usage = "automute <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {

    }
}