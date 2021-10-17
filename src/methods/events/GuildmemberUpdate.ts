import { GuildMember, PartialGuildMember } from "discord.js";
import { Autokick_Interface, Autoname_Interface } from "../../interfaces/auto.interface";
import Modified_Client from "../client/Client";

export const GuildmemberUpdate = async (client: Modified_Client, guildMemberOld: GuildMember | PartialGuildMember, guildMemberNew: GuildMember) => {
    if(!client.member_troll_list.has(guildMemberNew.id)) return;
    const get_member_troll_list = client.member_troll_list.get(guildMemberNew.id) as Autoname_Interface;
    if(!get_member_troll_list) return;
    switch(get_member_troll_list.state){
        case 'NAME':
            if(get_member_troll_list.nickname !== guildMemberNew.nickname)
                await get_member_troll_list.auto();
        break;
    }
}