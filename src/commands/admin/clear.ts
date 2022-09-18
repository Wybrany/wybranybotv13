import { ChannelType, Collection, Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

class CompareDate {

    private created: number;
    private difference: number = 0;

    constructor(created: number){
        this.created = created;
        this.calculate();
    }
    private calculate() {
        const currentDate = new Date().getTime();
        this.difference = currentDate - this.created;
    }
    get isNew(): boolean{
        return this.difference < (1000 * 3600 * 24 * 14);
    }
}

const deleteMessagesAsync = (messages: Collection<string, Message<boolean>>): Promise<boolean> => {
    return new Promise(async resolve => {
        for(const [ key, value ] of messages.entries()){
            await value.delete();
        }
        resolve(true);
    })
}

export default class implements Command {
    name ="clear";
    aliases = []
    category = "admin";
    description = "Removes messages depending on the input.";
    usage = "_clear <integer between 1 and 99>";
    permission = PermissionFlagsBits.Administrator;
    developerMode = false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        if(message.channel.type !== ChannelType.GuildText) return;
        const [ deleteCount = "1" ] = args;
        let amount = parseInt(deleteCount, 10) + 1;
        if(!amount || amount < 1 || amount > 100){
            message.error({content: "Please provide a number between 1 and 99 for the number of messages to delete", timed: 5000});
            return;
        } 
        try{
            const messages = await message.channel.messages.fetch({limit: amount});
            const deleteMessage = await message.info({content: `I will attempt at deleting ${amount - 1} messages. This could take a while...`});
            const newerMessages = new Collection() as Collection<string, Message<boolean>>;
            for(const [key, value] of messages){
                const compareDate = new CompareDate(value.createdTimestamp);
                if(!compareDate.isNew) continue;
                newerMessages.set(key, value);
                messages.delete(key);
            }
            if(newerMessages.size) {
                await message.channel.bulkDelete(newerMessages);
                if(!messages.size) 
                    deleteMessage.editEmbed({title: `Success`, content: `I have successfully deleted **${amount - 1}** messages. Thank you for your patience.`, timed: 5000, colorOverride: "Green"});
            }
            if(messages.size) {
                const done = await deleteMessagesAsync(messages);
                if(done) deleteMessage.editEmbed({title: `Success`, content: `I have successfully deleted **${amount - 1}** messages. Thank you for your patience.`, timed: 5000, colorOverride: "Green"});
            }

        } catch(e){
            message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            console.log(`Clear error: ${e}`);
            return;
        }
    }
}