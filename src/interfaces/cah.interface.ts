import { Message, OverwriteResolvable } from "discord.js";

export type Gamestate = "SETUP" | "SELECT" | "VOTE" | "ROUNDWON" | "PAUSE" | "GAMEOVER";

export interface ChannelConstructor {
    guildId: string;
    memberId: string;
    channelId: string;
    permissionOverwrites: OverwriteResolvable[];
}

export interface PlayerConstructor {
    memberId: string;
    channelId: string;
    points: number;
    whiteCards: string[];
    whiteCardMessageId: string | null;
    blackCardMessageId: string | null;
    waitmessage: Message;
    replacedcards: boolean;
    channel: ChannelConstructor;
}

export interface Game {
    currentcardzar: string;
    blackcard: BlackCard;
    deck: Deck;
    gamestarted: boolean;
    gamestate: Gamestate;
    players: PlayerConstructor[];
}

export interface Deck {
    packnames: string[];
    deckblackcards: BlackCard[];
    deckwhitecards: string[];
}

export interface AvailablePacks {
    packs: AvailablePack[];
}

export interface AvailablePack {
    name: string;
    id: string;
    quantity: {
        black: number;
        white: number;
        total: number;
    }
}

export interface Pack {
    pack: {
        name: string;
        id: string;
    }
    black: BlackCard[];
    white: string[];
}

export interface BlackCard {
    content: string;
    pick: number;
    draw: number;
}