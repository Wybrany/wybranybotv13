import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";

export default class implements Command{
    name = "moveall";
    aliases = [];
    category = "fun";
    description = "Moves all members in a voicechannel to either a random one or selected one";
    usage = "moveall [ voicechannelid | voicechannelname ]";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args?: string[]) => {

    }
}