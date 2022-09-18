import { Guild, GuildMember, Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { type } from "os";
import Modified_Client from "src/client/Client";

export enum VoteButtons {
    ButtonNo = "ButtonNo",
    ButtonYes = "ButtonYes"
}

export interface Vote {
    target: GuildMember;
    members: GuildMember[];
    embed: EmbedBuilder;
    buttonYes: ButtonBuilder;
    buttonNo: ButtonBuilder;
    interaction: ActionRowBuilder;
    message: Message;

    currentVotes: CurrentVotes[];

    addVote: (client: Modified_Client, member: GuildMember, type: "YES" | "NO") => void;
    updateVote: (member: GuildMember, type: "YES" | "NO") => void;
    removeVote: (member: GuildMember) => void;
    getVote: (member: GuildMember) => CurrentVotes | null;
    startTimer: (client: Modified_Client) => void;
    stopTimer: () => void;
    updateEmbed: (type: "FAILED" | "SUCCESS" | "VOTE") => void;
    muteMember: (member: GuildMember) => void;
    checkVotes: (client: Modified_Client) => void;
}

export interface CurrentVotes {
    member: GuildMember,
    vote: "YES" | "NO"
}