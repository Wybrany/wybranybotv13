import { ColorResolvable, Message, MessageEmbed, MessageOptions, MessageResolvable } from "discord.js";

interface MessageSendOptions {
    content: string;
    title?: string | null;
    disableTitle?: boolean;
    reply?: MessageResolvable | null;
    timed?: number | null;
    colorOverride?: ColorResolvable | null;
}

declare module "discord.js" {
    interface Message {
        info: (options: MessageSendOptions) => Promise<Message>;
        warn: (options: MessageSendOptions) => Promise<Message>;
        error: (options: MessageSendOptions) => Promise<Message>;
        success: (options: MessageSendOptions) => Promise<Message>;
        editEmbed: (options: MessageSendOptions) => Promise<Message>;
    }
}

const generateMessageEmbed = (content: string, color: ColorResolvable, title?: string): MessageEmbed => {
    const messageEmbed = new MessageEmbed()
        .setColor(color)
        .setDescription(content);

    if(title) messageEmbed.setTitle(title);
    return messageEmbed;
}

Message.prototype.info = async function(options: MessageSendOptions){
    const { content, reply = null, timed = null, colorOverride = null, title = null, disableTitle = false } = options;
    const embed = generateMessageEmbed(content, colorOverride ?? "BLUE", !disableTitle ? title ?? `Info` : undefined);
    const messageOptions: MessageOptions = {
        embeds: [embed]
    }
    if(reply) Object.assign(messageOptions, {messageReference: reply})
    const message = await this.channel.send(messageOptions);
    if(timed) setTimeout(async() => await message.delete(), timed);
    return message;
}

Message.prototype.warn = async function(options: MessageSendOptions){
    const { content, reply = null, timed = 0, colorOverride = null, title = null, disableTitle = false } = options;
    const embed = generateMessageEmbed(content, colorOverride ?? "YELLOW", !disableTitle ? title ?? `Warning` : undefined);
    const messageOptions: MessageOptions = {
        embeds: [embed]
    }
    if(reply) Object.assign(messageOptions, {messageReference: reply})
    const message = await this.channel.send(messageOptions);
    if(timed) setTimeout(async() => await message.delete(), timed);
    return message;
}

Message.prototype.success = async function(options: MessageSendOptions){
    const { content, reply = null, timed = 0, colorOverride = null, title = null, disableTitle = false } = options;
    const embed = generateMessageEmbed(content, colorOverride ?? "GREEN", !disableTitle ? title ?? `Success` : undefined);
    const messageOptions: MessageOptions = {
        embeds: [embed]
    }
    if(reply) Object.assign(messageOptions, {messageReference: reply})
    const message = await this.channel.send(messageOptions);
    if(timed) setTimeout(async() => await message.delete(), timed);
    return message;
}

Message.prototype.error = async function(options: MessageSendOptions){
    const { content, reply = null, timed = 0, colorOverride = null, title = null, disableTitle = false } = options;
    const embed = generateMessageEmbed(content, colorOverride ?? "RED", !disableTitle ? title ?? `Error` : undefined);
    const messageOptions: MessageOptions = {
        embeds: [embed]
    }
    if(reply) Object.assign(messageOptions, {messageReference: reply})
    const message = await this.channel.send(messageOptions);
    if(timed) setTimeout(async() => await message.delete(), timed);
    return message;
}

Message.prototype.editEmbed = async function(options: MessageSendOptions){
    const { content, reply = null, timed = 0, colorOverride = null, title = null, disableTitle = false  } = options;
    const embed = generateMessageEmbed(content, colorOverride ?? "RED", !disableTitle ? title ?? `Error` : undefined);
    const messageOptions: MessageOptions = {
        embeds: [embed]
    }
    if(reply) Object.assign(messageOptions, {messageReference: reply})
    const message = await this.edit(messageOptions);
    if(timed) setTimeout(async() => await message.delete(), timed);
    return message;
}