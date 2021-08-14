import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";

export default class implements Command{
    name = "ping";
    aliases = ["pong"];
    category = "admin";
    description = "Ping pong!";
    usage = "ping";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        console.log("Successfully executed command!")
    }
}