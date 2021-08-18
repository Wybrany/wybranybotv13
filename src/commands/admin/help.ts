import { Message, MessageEmbed, Collection, GuildMember, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";

const ownerId = process.env.OWNERID as string;

interface CategoryCommands {
    category: string;
    commands: Collection<string, Command>
}

export default class implements Command {
    name = "help";
    aliases = [];
    category = "admin";
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

const getCommands = (commands: Collection<string, Command>, member: GuildMember) => {
    return commands
        .filter(command => 
               (command?.permission ? member?.permissions.has(command.permission) : true)
            || (command.developerMode === true && member.id !== ownerId)
            || (command.ownerOnly === true && member.id !== ownerId)
            )
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

const getChunkBorders = (commands: CategoryCommands[]): string => {
    let text = "";

    for(const chunk of commands){
        const category = `${chunk.category.toUpperCase()}`
        const categoryBorder = `${Array(10).fill("-").join("")}${category}${Array(15 - category.length).fill("-").join("")}`
        const parsedCommand = chunk.commands.map(c => `\`- ${c.name}${Array(categoryBorder.length - c.name.length - 2).fill('\xa0').join("")}\``).join("\n");
        if(!parsedCommand) continue;
        text += `\`${categoryBorder}\`\n${parsedCommand}\n`
    }
    return text;
}

//Main functions

function getAllCommands(client: Modified_Client, message: Message){

    const title = `Available commands for: **${message.author.tag}**`;
    const member = message.guild?.members.cache.get(message.author.id);
    const categories = client.categories?.length ? client.categories : [];

    const allCommandsEmbed = new MessageEmbed()
        .setColor("BLUE")
        .setTitle(title)
        .setTimestamp();

    const getAvailableCommands = member ? getCommands(client.commands, member) : null;
    const getFilteredCommands = getAvailableCommands?.size ? filterCommandsByCategory(getAvailableCommands, categories) : null;

    let info = getFilteredCommands?.length ? getChunkBorders(getFilteredCommands) : "No commands are available for you...\n\n";

    info += `\nUse _help <command> to see more information.`
    allCommandsEmbed.setDescription(`${info}`);
    return message.channel.send({embeds: [allCommandsEmbed]});
}

function getCommand(client: Modified_Client, message: Message, input: string){
    const commandEmbed = new MessageEmbed()
    const cmd = client.commands.get(input.toLowerCase()) || client.commands.get(client.aliases.get(input.toLowerCase()) ?? "");
    const member = message.guild?.members.cache.get(message.author.id);

    let info = `No information found for command **${input.toLowerCase()}**`;

    if (!cmd) {
        commandEmbed.setColor("RED").setDescription(info)
        message.channel.send({embeds: [commandEmbed]});
        return;
    } 

    if(!(cmd?.permission ? member?.permissions.has(cmd.permission) : true) || cmd.developerMode === true && message.author.id !== ownerId || cmd.ownerOnly === true && message.author.id !== ownerId){
        info = `You don't have permission to view: **${cmd.name}**`
        commandEmbed.setColor("RED").setDescription(info)
        return message.channel.send({embeds: [commandEmbed]});
    }
    if (cmd.name) info = `**Command**: ${cmd.name}`;
    if (cmd.aliases) info += `\n**Aliases**: ${cmd.aliases.map(a => `"${a}"`).join(", ")}`;
    if (cmd.category) info += `\n**Category**: ${cmd.category}`;
    if (cmd.description) info += `\n**Description**: ${cmd.description}`;
    if (cmd.usage) info += `\n**Usage**: ${cmd.usage}`
    commandEmbed
        .addField("**Syntax**", `<> = required\n[] = optional\n| = or`)
        .setColor("GREEN")
        .setDescription(info);

    return message.channel.send({embeds: [commandEmbed]});
}