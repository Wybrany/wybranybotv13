import { Message, PermissionResolvable } from "discord.js";
import Client from "../client/Client";

export interface Command {
    name: string;
    aliases: string[];
    category: string;
    description: string;
    permission: PermissionResolvable;
    usage: string;
    ownerOnly?: boolean;
    developerMode?: boolean
    nsfw?: boolean;
    channelWhitelist?: string[];
    guildWhitelist?: string[];
    params?: boolean;

    run(client: Client, message: Message , args?: string[]): void;
}