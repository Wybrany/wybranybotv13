import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "balance";
    aliases = [];
    category = "economy";
    description = "Views your current balance.";
    usage = "balance";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        await message.delete();
        message.success({content: `You current balance: **${message.member?.economy.balance ?? "Unknown"}$**`});
    }
}