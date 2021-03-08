import { SkippedUser } from "../entities"
import { MongoClient } from "mongodb"
import { Repository } from "./Repository"

export class SkippedUsersRepository extends Repository<SkippedUser> {
    constructor(client: MongoClient, dbName: string) {
        super(client, dbName)
    }

    public async any(guildId: string, userId: string): Promise<boolean> {
        return super.get({ guildId: guildId, userId: userId })
            .then(entity => {
                return entity !== undefined && entity !== null
            })
    }

    public async delete(guildId: string, userId: string): Promise<boolean> {
        return super.deleteOne({ guildId: guildId, userId: userId })
    }
}