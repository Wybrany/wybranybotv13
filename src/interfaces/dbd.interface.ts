export interface Perk{
    name: string;
    aliases: string[];
    color: string;
}

export interface Killer {
    name: string;
    aliases: string[];
    type: string;
    original: boolean;
    addons: string[];
    perks: Perk[]
}

export interface Survivor {
    name: string;
    aliases: string[];
    type: string;
    original: boolean;
    perks: Perk[]
}

export interface Offering {
    name: string;
    aliases: string[];
}

export interface Item_Addon{
    name: string;
    aliases: string[];
    type: string;
    addons: string[];
}

export interface Exception_Overloader {
    (current: Killer[], excluded: Killer[], included: Killer[]): string[],
    (current: Perk[], excluded: Perk[], included: Perk[]): string[],
    (current: Offering[], excluded: Offering[], included: Offering[]): string[],
    (current: Item_Addon[], excluded: Item_Addon[], included: Item_Addon[]): string[],
}

export interface Standard_Killer_Perks{
    standard_killer_perks: Perk[]
}

export interface Standard_Survivor_Perks{
    standard_survivor_perks: Perk[]
}

export interface Killer_List{
    killer_list: Killer[];
}

export interface Survivor_List{
    survivor_list: Survivor[];
}

export interface Offering_List {
    map_offerings: Offering[]
}

export interface Item_Addons{
    item_list: Item_Addon[]
}
