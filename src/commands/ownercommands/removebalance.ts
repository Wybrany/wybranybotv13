import { Message, Permissions, Snowflake } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "removebalance";
    aliases = [];
    category = "ownercommands";
    description = "removes an amount to a users balance.";
    usage = "removebalance <number>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    params = true;
    ownerOnly = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        const [ member, amount ] = args;
        if(amount) {
            const guildMember = message.mentions.members?.first() ?? message.guild?.members.cache.get(member as Snowflake);
            if(guildMember) guildMember!.economy.balance -= parseFloat(amount);
            message.success({content: `Done :)`, timed: 2500});
        }
    }
}