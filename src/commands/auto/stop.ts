import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command{
    name = "stop";
    aliases = [];
    category = "auto";
    description = "Stops current autocommand on a user";
    usage = "stop <@mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        
    }
}