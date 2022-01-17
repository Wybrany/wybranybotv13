import { GuildMember } from "discord.js";

interface Economy {
    balance: number;
}

declare module "discord.js" {
    interface GuildMember {
        economy: Economy;
    }
}

GuildMember.prototype.economy = {
    balance: 0
}