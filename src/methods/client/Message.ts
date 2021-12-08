import { ColorResolvable, Message, MessageEmbed, ReplyOptions, MessageOptions, MessageResolvable } from "discord.js";
import { RawMessageData } from "discord.js/typings/rawDataTypes";
import Modified_Client from "./Client";

interface Options {
    content: string;
    reply?: MessageResolvable | null;
    timed?: number | null;
    colorOverride?: ColorResolvable | null;
}

interface NewMessageConstructor extends Message {
    info: (options: Options) => Promise<void>;
    warn: (options: Options) => Promise<void>;
    error: (options: Options) => Promise<void>;
    success: (options: Options) => Promise<void>;
}

class NewMessage extends Message implements NewMessageConstructor {

    constructor(client: Modified_Client, message: RawMessageData){
        super(client, message);
    }

    async info(options: Options){
        const { content, reply = null, timed = null, colorOverride = null } = options;
        const embed = generateMessageEmbed(`Info`, content, colorOverride ?? "BLUE");
        const messageOptions: MessageOptions = {
            embeds: [embed]
        }
        if(reply) Object.assign(messageOptions, {messageReference: reply})
        const message = await this.channel.send(messageOptions);
        if(timed)  setTimeout(async() => await message.delete(), timed);
    }
    async warn(options: Options){
        const { content, reply = null, timed = 0, colorOverride = null } = options;
        const embed = generateMessageEmbed(`Warning`, content, colorOverride ?? "YELLOW");
    }
    async error(options: Options){
        const { content, reply = null, timed = 0, colorOverride = null } = options;
        const embed = generateMessageEmbed(`Error`, content, colorOverride ?? "RED");
    }
    async success(options: Options){
        const { content, reply = null, timed = 0, colorOverride = null } = options;
        const embed = generateMessageEmbed(`Error`, content, colorOverride ?? "GREEN");
    }
}

const generateMessageEmbed = (title: string, content: string, color: ColorResolvable): MessageEmbed => {
    const messageEmbed = new MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription(content);

    return messageEmbed;
}

const generateMessageProperties = (message: Message): RawMessageData => {
    return {
        id: message.id,
        attachments: message.attachments,
        author: message.author,
        channel_id: message.channelId,
        content: message.content,
        edited_timestamp: message.editedTimestamp,
        embeds: message.embeds,
        mention_everyone: message.mentions.everyone,
        mention_roles: message.mentions.roles,
        mentions: message.mentions,
        pinned: message.pinned,
        timestamp: message.createdTimestamp,
        tts: message.tts,
        type: message.type,
        
    }
}

export const generateMessage = (client: Modified_Client, message: Message): NewMessage => {
    const properties = generateMessageProperties(message);
    return new NewMessage(client, properties);
}