import { Guild, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";

export interface Vote {
    target: GuildMember;
    members: GuildMember[];
    embed: MessageEmbed;
    buttonYes: MessageButton;
    buttonNo: MessageButton;
    interaction: MessageActionRow;
    message: Message;

    currentVotes: CurrentVotes[];

    addVote: (member: GuildMember, type: "YES" | "NO") => void;
    updateVote: (member: GuildMember, type: "YES" | "NO") => void;
    removeVote: (member: GuildMember) => void;
    getVote: (member: GuildMember) => CurrentVotes | null;
    startTimer: () => void;
    stopTimer: () => void;
    updateEmbed: (type: "FAILED" | "SUCCESS" | "VOTE") => void;
    muteMember: (member: GuildMember) => void;
    checkVotes: (CurrentVotes: CurrentVotes[]) => void;
}

export interface CurrentVotes {
    member: GuildMember,
    vote: "YES" | "NO"
}