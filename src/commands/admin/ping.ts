import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "ping";
    aliases = [];
    category = "admin";
    description = "Ping pong!";
    usage = "ping";
    permission = PermissionFlagsBits.Administrator;
    ownerOnly = true;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {
        message.info({content: 'Pinging...', disableTitle: true}).then(m => {
            m.editEmbed({content: `🏓Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`, colorOverride: "Green", title: "Success"});
        });
    }
}