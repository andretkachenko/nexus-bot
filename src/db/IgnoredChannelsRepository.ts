import { IgnoredChannel } from "../entities"
import { MongoClient } from "mongodb"
import { Repository } from "./Repository"

export class IgnoredChannelsRepository extends Repository<IgnoredChannel> {
    constructor(client: MongoClient, dbName: string) {
        super(client, dbName)
    }

    public async any(guildId: string, channelId: string): Promise<boolean> {
        return super.get({ guildId: guildId, channelId: channelId })
            .then(channel => {
                return channel !== undefined && channel !== null
            })
    }

    public async delete(guildId: string, channelId: string): Promise<boolean> {
        return super.deleteOne({ guildId: guildId, channelId: channelId })
    }
}