import Modified_Client from "../client/Client";
import { AuditLogEvent, GuildMember, PartialGuildMember, User } from "discord.js";
import { LeavingReason, MemberLeaveGuild } from "../managers/MemberLeaveGuild";
const TIME_APART_CONSTANT = 1_000;

const generateTimeStamp = () => new Date().getTime();
const convertActionType = (action: number): LeavingReason => action === 20 ? LeavingReason.KICKED : action === 22 ? LeavingReason.BANNED : LeavingReason.UNKNOWN;

const isAuditCreatedWithLeave = (auditTime: number, currentTime: number): boolean => currentTime - auditTime <= TIME_APART_CONSTANT;

export const GuildmemberRemove = async (client: Modified_Client, member: GuildMember | PartialGuildMember) => {
    const leftTimeStamp = generateTimeStamp();
    
    const guild = client.guilds.cache.get(member.guild.id);
    if(!guild) return;
    if(!guild.memberLeave) guild.memberLeave = new MemberLeaveGuild(client, guild);

    const auditLogs = await guild.fetchAuditLogs<AuditLogEvent>({limit: 1});
    const auditLog = auditLogs.entries.first();
    const { action, target, executor, targetType, actionType, createdTimestamp } = auditLog;

    if(!isAuditCreatedWithLeave(createdTimestamp, leftTimeStamp)) return;
    if(targetType !== "User" && actionType !== "Delete") return;
    
    const targetUser = target as User;
    const actionNumber = action as number;
    const leavingReason = convertActionType(actionNumber);
    if(leavingReason === LeavingReason.UNKNOWN && targetUser.id !== member.id) return;

    const executorMember = guild.members.cache.get(executor.id) || guild.members.cache.find(m => m.id === executor.id) || await guild.members.fetch({user: executor}) || null;
    if(!executorMember) return;

    await guild.memberLeave.handleMemberLeave({
        targetId: targetUser.id,
        targetName: targetUser.username,
        previousRoles: member.roles.cache.filter((role) => role.name !== "@everyone"),
        reason: leavingReason,
        executor: executorMember,
    });
}