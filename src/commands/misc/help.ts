import { Message, MessageEmbed, Collection, GuildMember, Permissions, EmbedField } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

const ownerId = process.env.OWNERID as string;
const prefix = process.env.PREFIX as string;

interface CategoryCommands {
    category: string;
    commands: Collection<string, Command>
}

class Field implements EmbedField {
    public name: string;
    public value: string;
    public inline: boolean;

    constructor(name: string, value: string, inline: boolean){
        this.name = name;
        this.value = value;
        this.inline = inline;
    }
}

export default class implements Command {
    name = "help";
    aliases = [];
    category = "misc";
    description = "Returns all available commands, depending on permission, to the user. Alternatively, returning description/usage of a specific command.";
    permission = Permissions.FLAGS.SEND_MESSAGES;
    usage = "help [command]";

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        const command = args.join(" ");
        if(!command) return getAllCommands(client, message);
        else return getCommand(client, message, command);
    }
}

//Helper functions

const getCommands = (commands: Collection<string, Command>, member: GuildMember): Collection<string, Command> => {
    const filteredCommands: Collection<string, Command> = new Collection();
    for(const command of [...commands.values()]){
        if(command.guildWhitelist && !command.guildWhitelist.includes(member.guild.id)) continue;
        if(command.permission && !member.permissions.has(command.permission)) continue;
        if(command.developerMode && member.id !== ownerId) continue;
        if(command.ownerOnly && member.id !== ownerId) continue;
        filteredCommands.set(command.name, command);
    }
    return filteredCommands;
}

const filterCommandsByCategory = (commands: Collection<string, Command>, categories: string[]) => {

    const filteredCommands: CategoryCommands[] = []

    for(const category of categories){
        const filter = commands.filter(c => c.category.toLowerCase() === category.toLowerCase());
        if(!filter.size) continue;
        filteredCommands.push({category: category, commands: filter})
    }
    return filteredCommands;
}

const getChunkBorders = (commands: CategoryCommands[], prefix: string): Field[] => {
    const Fields: Field[] = [];
    for(const chunk of commands){
        const categoryName = chunk.category.toUpperCase();
        const commands = [...chunk.commands.values()];
        const generateName = (name: string, flag?: boolean | undefined): string => `\`${prefix}${name}${flag ? ` ❗` : ``}${new Array(12 - name.length - (flag ? 2 : 0)).fill(" ").join("")}:\``; 
        const commandField = new Field(
                `**${categoryName}**`, 
                commands.map(c => `${c.name.length >= 10 ? c.aliases.length ? generateName(c.aliases[0], c.params) : generateName(c.name.substring(0, 10), c.params) : generateName(c.name, c.params)} ${c.description.length >= 50 ? (c.description.substring(0, 50) + "...") : c.description}`).join("\n"),
                false
            );
        Fields.push(commandField);
    }
    return Fields;
}

//Main functions

function getAllCommands(client: Modified_Client, message: Message){
    try{
        if(!message.guild) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        const member = message.guild?.members.cache.get(message.author.id);
        const categories = client.categories?.length ? client.categories : [];
        if(!member || !member.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
    
        const allCommandsEmbed = new MessageEmbed()
            .setAuthor(`Available commands for: ${member.user.tag}`, member.user.avatarURL() ?? member.user.defaultAvatarURL)
            .setColor("BLUE")
            .setTimestamp();
    
        const getAvailableCommands = member ? getCommands(client.commands, member) : null;
        const getFilteredCommands = getAvailableCommands?.size ? filterCommandsByCategory(getAvailableCommands, categories) : null;
    
        const fields = getFilteredCommands?.length ? getChunkBorders(getFilteredCommands, message.guild.prefix) : null;
    
        if(!fields || !fields.length) allCommandsEmbed.setDescription(`No commands are available for you.`).setColor("RED");
        else allCommandsEmbed.setFields(fields).setDescription(`Commands with ❗ requires additional parameters to work.\nUse ${message.guild.prefix}help <command> to see more information.`)
    
        return message.channel.send({embeds: [allCommandsEmbed]});
    }catch(e){
        console.error(`Something went wrong.. ${e}`);
        message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
    }
}


function getCommand(client: Modified_Client, message: Message, input: string){
    if(!message.guild) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
    const commandEmbed = new MessageEmbed()
    const member = message.guild?.members.cache.get(message.author.id);

    if(!member) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
    const availableCommands = getCommands(client.commands, member);
    const cmd = availableCommands.get(input.toLowerCase()) || availableCommands.get(client.aliases.get(input.toLowerCase()) ?? "");

    let info = `No information found for command **${input.toLowerCase()}**`;

    if(!cmd) {
        commandEmbed.setColor("RED").setDescription(info)
        message.channel.send({embeds: [commandEmbed]});
        return;
    }

    if(cmd.name) info = `**Command**: ${cmd.name}`;
    if(cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `"${a}"`).join(", ")}`;
    if(cmd.category) info += `\n**Category**: ${cmd.category}`;
    if(cmd.description) info += `\n**Description**: ${cmd.description}`;
    if(cmd.usage) info += `\n**Usage**: ${message.guild.prefix}${cmd.usage}`
    commandEmbed
        .addField("**Syntax**", `<> = required\n[] = optional\n| = or`)
        .setColor("GREEN")
        .setDescription(info);

    return message.channel.send({embeds: [commandEmbed]});
}
