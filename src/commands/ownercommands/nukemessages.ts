import { Message, MessageEmbed, Permissions, Snowflake, TextChannel, User } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { delayFunction } from "../../utils/utils";

export default class implements Command{
    name = "nukemessages";
    aliases = [];
    category = "ownercommands";
    description = "Nukes messages related to a specific user or mentions of that user.";
    usage = "nukemessages <target>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    params = true;
    ownerOnly = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        if(!client || !message?.guild) return message.error({content: `Something went wrong using this command. No client/guild instance.`, timed: 5000});

        const [ member ] = args;
        if(!member) return message.error({content: `Please give me a target.`, timed: 5000});

        let target: any = message.mentions.users.first() || message.guild.members.cache.get(member) || null;

        const embed = new MessageEmbed()
            .setTitle(`Nukeprogress`)
            .setDescription(`Warming up...`)
            .setTimestamp()
            .setColor(`RANDOM`);

        let stopped = false;

        if(!target){
            target = member;
            embed.setDescription(`User is not in server, will nuke stuff assuming \`${target}\`.\n\nUse \`STOP\` to stop this process. You have 10 seconds.`);
        }else {
            embed.setDescription(`I will nuke everything containing ${target}.`);
        }

        const nukeMessage = await message.channel.send({embeds: [embed]});
        const filter = (m: Message) => m.content === "STOP";
        const collector = message.channel.createMessageCollector({time: 10000, filter});

        collector.on('collect', async m => {
            await nukeMessage.editEmbed({content: `Command has been stopped...`});
        });

        collector.on('end', async m => {
            if(stopped) return;
            await nukeMessage.editEmbed({content: `I will now start nuking.`, title: `Nukeprogress`, colorOverride: `RANDOM`});
            await delayFunction(1000);
            await NukeFunction(client, nukeMessage, target);
        });
    }
}

const returnObject = (m: Message) => ({
    author: m.author,
    content: m.content,
    attachments: m.attachments.size ? m.attachments.map(a => a): {},
    timestamp: new Date(m.createdTimestamp).toUTCString(),
    messageid: m.id,
    channel: m.channel.id,
    mentions: m.mentions
})

async function NukeFunction(client: Modified_Client, message: Message, target: any){
    if(!client || !message?.guild) return console.error(`No message or guild.`);
    const guild = client.guilds.cache.get(message.guild?.id);
    const channelIds = guild?.channels.cache.filter(c => c.type === "GUILD_TEXT").map(c => c.id);
    if(!channelIds) return console.error(`No channelIds`);
    for(const id of channelIds){
        const channel = guild?.channels.cache.get(id) as TextChannel;
        if(!channel) continue;
        await message.editEmbed({title: `Nukeprogress`, colorOverride: `RANDOM`, content: `Fetching messages in ${channel.name}.`,});
        await delayFunction(1000);

        const messages = await channel.messages.fetch({limit: 100});
        const newMessages = messages.map(returnObject);

        let done = false;
        while(done){
            const options = {
                limit: 100,
                before: newMessages?.[newMessages.length - 1]?.messageid
            }
            const messagesBefore = await channel.messages.fetch(options);
            if(!messagesBefore.size) {
                done = true
                break;
            }
            const parsedMessages = messagesBefore.map(returnObject);
            if(!parsedMessages.length) {
                done = true;
                break;
            }
            newMessages.push(...parsedMessages);
            console.log(newMessages.length)
            await message.editEmbed({title: `Nukeprogress`, colorOverride: `RANDOM`, content: `Fetching messages in ${channel.name}.\n\nTotal messages: \`${newMessages.length}\``})
        }
        console.log(`${newMessages.map(a => `${a.author.username} - ${a.content}`).join("\n")}`);
        await message.editEmbed({title: `Nukeprogress`, colorOverride: `RANDOM`, content: `Scanning trough \`${newMessages.length}\` messages...`});
        const messagesContainingOurStuff = newMessages.filter(m => m.author.id === target?.author?.id || m.author.username.includes(target?.author?.username ?? target) || m.content.includes(target?.author?.username ?? target) || m.mentions.users.find(u => u.username.includes(target?.author?.username ?? target) || u.id === target?.author?.id));
        console.log("-------------------------------------------")
        console.log(`${messagesContainingOurStuff.map(a => `${a.author.username} - ${a.content}`).join("\n")}`);
        await message.editEmbed({title: `Nukeprogress`, colorOverride: `RANDOM`, content: `I have found \`${messagesContainingOurStuff.length}\` messages. Now attempting to delete them...`});
        console.log("Done")
        break;
    }
}

async function UpdateEmbed(message: Message, content: string){
    message
}