import { Message, PermissionResolvable } from "discord.js";
import Client from "src/methods/client/Client";

export interface Command {
    name: string;
    aliases: string[];
    category: string;
    description: string;
    permission?: PermissionResolvable;
    usage: string;
    ownerOnly?: boolean;
    developerMode?: boolean
    nsfw?: boolean;
    channelWhitelist?: string[];

    run(client: Client, message: Message , args?: string[]): void;
}