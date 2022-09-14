import { ColorResolvable, GuildManager, GuildMember, Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { promisify } from "util";
import { Vote, CurrentVotes } from "../types/vote.interface";
import Modified_Client from "../client/Client";

const wait = promisify(setTimeout);

export class Vote_Class implements Vote {
    public target: GuildMember;
    public members: GuildMember[];
    public message: Message;
    public embed: EmbedBuilder;
    public buttonYes: ButtonBuilder;
    public buttonNo: ButtonBuilder;
    public currentVotes: CurrentVotes[];
    public interaction: ActionRowBuilder;

    private timerLength: number;
    private timerStarted: boolean;
    private timer: any;


    constructor(
        target: GuildMember, 
        members: GuildMember[], 
        message: Message, 
        embed: EmbedBuilder, 
        buttonYes: ButtonBuilder, 
        buttonNo: ButtonBuilder, 
        interaction: ActionRowBuilder
        ){
            this.target = target;
            this.members = members;
            this.buttonYes = buttonYes;
            this.buttonNo = buttonNo;
            this.message = message;
            this.embed = embed;
            this.interaction = interaction;

            this.currentVotes = [{member: this.target, vote: "NO"}];
            this.timerLength = 60000;
            this.timerStarted = false;
            this.timer = null;
    }
    addVote(client:Modified_Client ,member: GuildMember, type: "YES" | "NO"){
        const vote: CurrentVotes = {member: member, vote: type};
        if(this.currentVotes.some(vote => vote.member.id === member.id)) return;
        this.currentVotes.push(vote);
        if(this.members.length === this.currentVotes.length){
            clearTimeout(this.timer);
            return this.checkVotes(client)
        }
        return this.updateEmbed("VOTE");
    }
    updateVote(member: GuildMember, type: "YES" | "NO"){
        const vote: CurrentVotes = {member: member, vote: type};
        if(this.currentVotes.some(vote => vote.member.id !== member.id)) return;
        this.removeVote(member);
        this.currentVotes.push(vote);
        this.updateEmbed("VOTE");
    }
    removeVote(member: GuildMember){
        this.currentVotes = this.currentVotes.filter(vote => vote.member.id !== member.id);
    }
    getVote(member: GuildMember) {
        const vote: CurrentVotes | undefined = this.currentVotes.find(vote => vote.member.id === member.id);
        return vote ?? null;
    }
    startTimer(client: Modified_Client){
        this.timer = setTimeout(() => this.checkVotes(client), this.timerLength);
    }
    stopTimer(){
        clearTimeout(this.timer);
        this.timer = null;
        this.updateEmbed("FAILED");
    }
    muteMember(member: GuildMember){
        const guild = this.message.guild;
        if(!guild) return; //Add more checks later
        const guildMember = guild.members.cache.get(member.id);
        if(!guildMember) return;
        guildMember.voice.setMute(true, "Voted by other guildmembers");
        this.updateEmbed("SUCCESS")
    }
    checkVotes(client: Modified_Client){
        const yesVotes = this.currentVotes.filter(vote => vote.vote === "YES");
        if(yesVotes.length > (Math.floor(this.currentVotes.length / 2))) this.muteMember(this.target);
        else this.updateEmbed("FAILED");
        client.currentVote.delete(this.target.id);
    }
    updateEmbed(type: "FAILED" | "SUCCESS" | "VOTE"){
        switch(type){
            case 'VOTE':
                const voteEmbed = createEmbed(
                    `Voting to mute ${this.target.user.tag}`,
                    "DarkButNotBlack",
                    `Vote "YES" or "NO" if you want to mute this user.\n\n${this.currentVotes.length}/${this.members.length} has voted.`,
                    this.target
                )
                this.message.edit({embeds: [voteEmbed]})
            break;

            case 'FAILED':
                const failedEmbed = createEmbed(
                    `VOTE HAS FAILED.`,
                    "Red",
                    `Vote failed to mute ${this.target.user.tag}`,
                    this.target
                )
                const interactionFailed = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(this.buttonYes.setDisabled(true), this.buttonNo.setDisabled(true));
                this.message.edit({embeds: [failedEmbed], components: [interactionFailed]})
            break;

            case 'SUCCESS':
                const successEmbed = createEmbed(
                    `VOTE WAS SUCCESSFUL.`,
                    "Green",
                    `Successfully muted ${this.target.user.tag}`,
                    this.target
                )
                const interactionSuccess = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(this.buttonYes.setDisabled(true), this.buttonNo.setDisabled(true));
                this.message.edit({embeds: [successEmbed], components: [interactionSuccess]});
            break;
        }
    }
}

const createEmbed = (title: string, color: ColorResolvable, description: string, target: GuildMember) => {
    return new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(description)
        .setThumbnail(target.user.displayAvatarURL())
        .setTimestamp();
}