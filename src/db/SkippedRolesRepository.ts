import { SkippedRole } from "../entities"
import { MongoClient } from "mongodb"
import { Repository } from "./Repository"

export class SkippedRolesRepository extends Repository<SkippedRole> {
    constructor(client: MongoClient, dbName: string) {
        super(client, dbName)
    }

    public async getAll(guildId: string): Promise<SkippedRole[]> {
        return super.getMany({ guildId: guildId })
    }

    public async any(guildId: string, userId: string): Promise<boolean> {
        return super.getFirst({ guildId: guildId, roleId: userId })
            .then(entity => {
                return entity !== undefined && entity !== null
            })
    }

    public async delete(role: SkippedRole): Promise<boolean> {
        return super.deleteOne({ guildId: role.guildId, roleId: role.roleId })
    }
}