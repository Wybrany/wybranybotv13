import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
//import urban from "urban";
import { stripIndent } from "common-tags";

const image = "http://cdn.marketplaceimages.windowsphone.com/v8/images/5c942bfe-6c90-45b0-8cd7-1f2129c6e319?imageType=ws_icon_medium";

interface urban {

}

export default class implements Command {
    name = "urban";
    aliases = [];
    category = "fun";
    description = "Urban dictionary.. Need I say more?";
    usage = "urban <random || search> [search-term]";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = true;
    guildWhitelist = ["456094195187449868"];
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        return;

        const [ query, ...search_term ] = args;
        if(!query || !["random", "search"].includes(query)) 
            return message.reply({content: `Your query did not match anything. Try "random" or "search search-term"`});

        try{
            /*const search = query ? urban(search_term.join(" ")) : urban.random();
            const response = await search.first();
            if(!response) return message.reply({content: "No results found for this topic."});

            const { word = null, definition = null, example = null, thumbs_up = null, thumbs_down = null, permalink = null, author = null} = response

            const embed = new EmbedBuilder()
                .setColor('#0080FF')
                .setAuthor(`Urban dictionary | ${word}`, image)
                .setThumbnail(image)
                .setDescription(stripIndent`**Definition: ** ${definition.substring(0,1500) || "No definition"}
                **Example: ** ${example || "No Example"}"
                **Upvote: ** ${thumbs_up || 0}
                **Downvote: ** ${thumbs_down || 0}
                **Link: ** [link to ${word}](${permalink || "https://www.urbandictionary.com/"})`)
                .setTimestamp()
                .setFooter(`Written by ${author || "unknown"}`);

            message.channel.send({embeds: [embed]});*/
        } catch(e) {
            console.error(e)
            return message.channel.send({content: "Something went wrong when executing the command. Please try again later."});
    }
    }
}