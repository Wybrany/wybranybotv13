import { Guild, GuildMember, Collection, Role, EmbedBuilder, ButtonBuilder, MessageOptions, ActionRowBuilder, Snowflake, PartialGuildMember, ButtonStyle } from "discord.js";
import { MemberLeaveSettings } from "src/types/guildsettings.interface";
import Modified_Client from "../client/Client";
import { savefiledata } from "./backup";

export interface LeavingMemberProperties {
    targetId: Snowflake;
    targetName: string;
    executor: GuildMember;
    giveBackRoles: boolean;
    oldRoles: Collection<string, Role> | null;
    reason: LeavingReason;
}

export enum LeavingReason {
    KICKED = "Kicked",
    BANNED = "Banned",
    COMMAND = "Command",
    UNKNOWN = "Unknown"
}

export class MemberLeaveGuild {
    private client: Modified_Client;
    private guild: Guild;
    private leavingMembers: LeavingMemberProperties[] = [];

    constructor(client: Modified_Client, guild: Guild){
        this.client = client;
        this.guild = guild;
    }
    
    async handleMemberJoin(memberid: Snowflake): Promise<void> {
        if(!this._leavingMemberExists(memberid)) return;
        await this._giveMemberRolesBack(memberid);
    }

    async handleMemberLeave(options: { targetId: Snowflake, targetName: string, executor: GuildMember, reason: LeavingReason, previousRoles: Collection<string, Role> }) {
        const { targetId, targetName, reason, executor, previousRoles } = options;
        if(this._leavingMemberExists(targetId)) return;
        await this._sendMessageToUser({reason, executor, targetId, targetName, previousRoles})
    }


    removeLeavingMemberFromCommand(memberid: Snowflake, save?: boolean): {success: boolean, type: string} {
        const index = this._getLeavingMemberIndex(memberid);
        if(index !== -1) {
            this.leavingMembers.splice(index, 1);
            if(save) savefiledata(this.client, this.guild.id);
            return {success: true, type: "removed"};
        }
        return {success: false, type: "Member does not have any saved roles."};
    }

    addLeavingMemberFromCommand(options: {target: GuildMember, executor: GuildMember}): {success: boolean, type: string} {
        const { target, executor } = options;
        if(this._leavingMemberExists(target.id)) return { success: false, type: "Member already has saved roles." };
        const leavingMember: LeavingMemberProperties = {
            executor,
            giveBackRoles: true,
            oldRoles: target.roles.cache.filter(role => role.name !== "@everyone"),
            reason: LeavingReason.COMMAND,
            targetId: target.id,
            targetName: target.user.username
        }
        this._addLeavingMember(leavingMember);
        return { success: true, type: "added"};
    }

    updateLeavingMemberFromCommand(options: {target: GuildMember, executor: GuildMember}): { success: boolean, type: string } {
        const { target, executor } = options;
        if(!this._leavingMemberExists(target.id)) return { success: false, type: "Member does not have any saved roles."};
        this.removeLeavingMemberFromCommand(target.id);
        this.addLeavingMemberFromCommand({executor, target});
        return { success: true, type: "updated"};
    }

    addMemberFromBackup(member: LeavingMemberProperties) {
        this.leavingMembers.push(member);
    }

    get leavingMembersToBackup(): MemberLeaveSettings[] | null {
        if(!this.leavingMembers || !this.leavingMembers.length) return null;
        return this.leavingMembers.map(member => ({
            executor: member.executor.id,
            giveBackRoles: member.giveBackRoles,
            oldRoles: member.oldRoles.map(role => role.id), 
            reason: member.reason,
            targetId: member.targetId,
            targetName: member.targetName
        })) as MemberLeaveSettings[];
    }

    private _leavingMemberExists(memberid: Snowflake): boolean {
        return this.leavingMembers?.some(m => m.targetId === memberid) ?? false;
    }

    private _shouldGiveRolesBack(memberid: Snowflake): boolean {
        return this.leavingMembers?.find(m => m.targetId === memberid)?.giveBackRoles ?? false;
    }

    private async _giveMemberRolesBack(memberid: Snowflake): Promise<void> {
        if(!this._shouldGiveRolesBack(memberid)) return;

        const guild = this.client.guilds.cache.get(this.guild.id);
        if(!guild) {
            console.error(`I can't find guild when giving the members roles back.`);
            return;
        }
        const member = guild.members.cache.get(memberid) || guild.members.cache.find(m => m.id === memberid) || null;
        if(!member){
            console.error(`I can't find member when giving the members roles back.`);
            return;
        }
        const memberRoles = this.leavingMembers.find(m => m.targetId === memberid) || null;
        if(!memberRoles || !memberRoles?.oldRoles || !memberRoles?.oldRoles?.size){
            console.error(`I can't find memberroles when giving the members roles back.`);
            return;
        }
        for(const [ snowflake, role ] of memberRoles?.oldRoles.entries()){
            try{
                await member.roles.add(role);
            }catch(e){
                console.error(`Failed giving role: ${role.name} to ${member.user.username} in guild: ${guild.name}. Reason: ${e}`);
            }
        }
    }

    private _addLeavingMember(leavingMember: LeavingMemberProperties): void {
        this.leavingMembers.push(leavingMember);
        savefiledata(this.client, this.guild.id);
    }

    private _getLeavingMemberIndex(memberid: Snowflake): number {
        const leavingMember = this.leavingMembers.find(m => m.targetId === memberid);
        if(!leavingMember) return -1;
        const index = this.leavingMembers.indexOf(leavingMember);
        return index;
    }

    private _createMessageOptions(options: {reason: LeavingReason, targetId: Snowflake, targetName: string, previousRoles: Collection<string, Role> }): MessageOptions {

        const roleStringList = [...options.previousRoles.values()].map(role => role.name).join("\n")

        const embed = new EmbedBuilder()
            .setTitle(`You have ${options.reason} ${options.targetName}.`)
            .setDescription(`This member has been **${options.reason}**. I'm sending this message to make sure I'm not saving any roles incase this was justifiable. Do you want me to save this user's roles?\n\nIncase you regret your descision you can use the command ${this.guild.prefix}removeroles <@${options.targetId}> in the server!\n\nHere's a list of the roles that will be saved.\n\n${roleStringList}`)
            .setFooter({text: `I will only ask this once :)`})
            .setTimestamp();
        
        const buttonYes = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setEmoji("✅")
            .setLabel("Yes")
            .setCustomId(`memberLeaveYes-${options.targetId}`);

        const buttonNo = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setEmoji("❌")
            .setLabel("No")
            .setCustomId(`memberLeaveNo-${options.targetId}`);

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(buttonYes, buttonNo);
        
        return { embeds: [embed], components: [actionRow] };
    }

    private async _sendMessageToUser(options: {reason: LeavingReason, executor: GuildMember, targetId: Snowflake, targetName: string, previousRoles: Collection<string, Role> }): Promise<void>{
        try {
            const { reason, executor, targetId, targetName, previousRoles } = options;
            const messageOptions = this._createMessageOptions({reason, targetName, targetId, previousRoles}) ;

            const dm = await executor.createDM();
            const message = await dm.send(messageOptions);
            const collector = message.createMessageComponentCollector({time: 60000, max: 1});

            collector.on("collect", async collected => {
                try{
                    await collected.deferUpdate();
                    let giveBackRoles = false;
                    if(collected.customId === `memberLeaveYes-${targetId}`) giveBackRoles = true;
                    this._addLeavingMember({executor, giveBackRoles, reason, targetId, targetName, oldRoles: previousRoles});
                }catch(e){
                    console.error(`Something went wrong with collect collector. ${e}`);
                }
            });

            collector.on("end", async collector => {
                try{
                    const yesOrNo = collector.first().customId.split("-")[0] === "memberLeaveYes";
                    const embed = new EmbedBuilder()
                        .setTitle("Done!")
                        .setDescription(`**${targetName}** will ${yesOrNo ? `now recieve previous roles when rejoining the server.` : `not recieve any roles when rejoining the server.`}\n\nIf you change your mind you can still use the command command ${this.guild.prefix}removeroles <@${options.targetId}> in the server!`)
                        .setTimestamp();
                    if(embed) await message.edit({embeds: [embed], components: []});
                }catch(e){
                    console.error(`Something went wrong with end collector. ${e}`);
                }
            });

        }catch(e){
            console.error(`Something went wrong in _sendMessageToUser. Reason: ${e}`);
        }
    }
}