import { Message, MessageEmbed, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
import fetch from "node-fetch";

interface Api {
    success: boolean,
    data: {
        title: string;
        body: string;
        url: string;
        image: string;
    }
}

export default class implements Command {
    name = "meme";
    aliases = [];
    category = "fun";
    description = "Sends dank memes";
    usage = "meme";
    channelWhitelist = ["media", "memes", "meme", "images", "private"];
    permission = Permissions.FLAGS.SEND_MESSAGES;
    developerMode = true;
    guildWhitelist = ["456094195187449868"];

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        message.channel.send("Generating...").then(async msg =>{
            try{
                const response = await fetch("https://apis.duncte123.me/meme");
                if(response.status !== 200) return msg.edit({content: "Request failed. Please try again later."})
                const data: Api = await response.json();
                if(!data.success)
                    return msg.edit({content: "Request failed. Please try again later."});
                
                const { title, body, url, image } = data.data;

                const embed = new MessageEmbed()
                    .setColor("#0080FF")
                    .setTitle(title)
                    .setImage(image)
                    .setTimestamp();

                if(title) embed.setTitle(title).setURL(url);
                return msg.edit({content: ``, embeds: [embed]});
            }
            catch(err){
                msg.edit({content: "Something went wrong. Please try again later."})
                console.log(err);
            }
            
        })
    }
}