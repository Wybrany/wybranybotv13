//@ts-nocheck
import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { deleteMessage } from "../../managers/deletemessage";

export default class implements Command{
    name = "musicquiz";
    aliases = ["mq", "musicq", "mquiz"];
    category = "minigames";
    description = "Starts a music quiz with members in a voicechannel";
    usage = "mq <settings | start | stop>";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = true;
    guildWhitelist = ["456094195187449868"];
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

    }
}