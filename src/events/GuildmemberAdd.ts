import { GuildMember } from "discord.js";
import { Autokick_Interface } from "src/types/auto.interface";
import Modified_Client from "../client/Client";

export const GuildmemberAdd = async (client: Modified_Client, member: GuildMember) => {
    if(!client.member_troll_list.has(member.id)) return;
    const get_member_troll_list = client.member_troll_list.get(member.id) as Autokick_Interface;
    if(get_member_troll_list.state !== "KICK") return;

    if(get_member_troll_list.give_roles_back){
        get_member_troll_list.give_back_roles();
        client.member_troll_list.delete(member.id);
    }

    if(!get_member_troll_list.startNextTroll) return;

    get_member_troll_list.change_troll_state(true);
    get_member_troll_list.start_timer();
}