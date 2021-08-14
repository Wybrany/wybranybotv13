import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";


export default class implements Command {
    name ="clear";
    aliases = []
    category = "admin";
    description = "Removes messages depending on the input.";
    usage = "_clear <integer between 2 and 100>";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        if(message.channel.type !== "GUILD_TEXT") return;
        const [ deleteCount = "0" ] = args;
        let amount = parseInt(deleteCount, 10) + 1;
        let newAmount = amount;
        if(!amount || amount < 1 || amount > 100){
            message.reply({content: "Please provide a number between 1 and 99 for the number of messages to delete"});
            return;
        } 

        //Måste kolla om meddelanderna är äldre än 14 dagar innan jag tar bort dem.
        try{
            const fetched = await message.channel.messages.fetch({limit: amount});
            if(!fetched.size) {
                message.reply("I can't read any messages for some unknown reason. Please try again later.");
                return;
            }
            const timeStamps = fetched.map(m => (message.createdTimestamp - m.createdTimestamp));
            const removeOldArguments = timeStamps.filter(t => (Math.floor(t / 1000 / 3600 / 24)) > 14);
            if(removeOldArguments.length){
                newAmount = (timeStamps.length - removeOldArguments.length);
                const reFetch = await message.channel.messages.fetch({limit: newAmount});
                message.channel.bulkDelete(reFetch);
            }
            else message.channel.bulkDelete(amount);
            if(amount === newAmount){
                amount--;
                const messageReply = amount === 1 ? `Cleared ${amount} message!` : `Cleared ${amount} messages!` 
                message.reply(messageReply)
            }
            else message.reply(`I can't bulkdelete messages that are older than 14 days old. ${newAmount === 1 ? `` : `I could however delete ${newAmount -= 1 } messages` }`)
            return;
        } catch(e){
            message.reply(`Clear error: ${e}`);
            console.log(`Clear error: ${e}`);
        }
    }
}