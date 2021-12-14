import { Message, MessageEmbed } from "discord.js";
import Modified_Client from "../client/Client";
import { createMessageEmbed } from "./createMessageEmbed";

export const checkForMention = (message: Message, client: Modified_Client , guildPrefix: string): void => {
    if(!client.user || !message.mentions) return;
    if(message.mentions.has(client.user.id)){
        if(message.mentions.has("@everyone") || message.mentions.has("@here")) return;
        const replyMessage = createMessageEmbed(`Current prefix for this guild => **${guildPrefix}**`, "GREEN") as MessageEmbed;
        message.channel.send({ embeds: [replyMessage]});
        return;
    } 
}