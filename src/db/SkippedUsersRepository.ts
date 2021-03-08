import { SkippedUser } from "../entities"
import { MongoClient } from "mongodb"
import { Repository } from "./Repository"

export class SkippedUsersRepository extends Repository<SkippedUser> {
    constructor(client: MongoClient, dbName: string) {
        super(client, dbName)
    }

    public async any(guildId: string, userId: string): Promise<boolean> {
        return super.getFirst({ guildId: guildId, userId: userId })
            .then(entity => {
                return entity !== undefined && entity !== null
            })
    }

    public async delete(user: SkippedUser): Promise<boolean> {
        return super.deleteOne({ guildId: user.guildId, userId: user.userId })
    }
}