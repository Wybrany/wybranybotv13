import { Message } from "discord.js";
import Modified_Client from "../client/Client";

export const shuffle = (range: number, push: number): number[] | number => {
    const array = new Array(range).fill(0).map((a, i) => i);
    for(let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array && push === 1 ? array.splice(0, 1)[0] : array.splice(0, push);
}

export const checkForMention = (message: Message, client: Modified_Client , guildPrefix: string): void => {
    if(!client.user || !message.mentions) return;
    if(message.mentions.has(client.user.id)){
        if(message.mentions.has("@everyone") || message.mentions.has("@here")) return;
        message.info({content: `Current prefix for this guild => **${guildPrefix}**`});
        return;
    } 
}

export const delayFunction = (time_ms: number) => new Promise(resolve => setTimeout(resolve, time_ms));