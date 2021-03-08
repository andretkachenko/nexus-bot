import { IGuildRelated } from "."

export interface SkippedRole extends IGuildRelated {
    guildId: string
    roleId: string
}