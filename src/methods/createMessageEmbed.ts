import { ColorResolvable, MessageEmbed } from "discord.js";

export const createMessageEmbed = (description: string = "NO DESCRIPTION WAS SUBMITED", color: ColorResolvable = "RED"): MessageEmbed | string => {
        if(typeof(description) !== "string" || typeof(color) !== "string") return "Empty message.";
        return new MessageEmbed()
            .setDescription(`${description}`)
            .setColor(color)
    }
