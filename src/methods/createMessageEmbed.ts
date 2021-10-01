import { ColorResolvable, MessageEmbed } from "discord.js";

export const createMessageEmbed = (description: string = "NO DESCRIPTION WAS SUBMITED", color: ColorResolvable = "RED"): MessageEmbed => {
        return new MessageEmbed()
            .setDescription(`${description}`)
            .setColor(color)
    }
