import { IgnoredChannel } from "../entities/IgnoredChannel"
import { MongoClient } from "mongodb"
import { Config } from "../config"

export class IgnoredChannelsRepository {
    private client: MongoClient
    private ignoredChannelsCollectionName: string
    private dbName: string

    constructor(client: MongoClient, config: Config) {
        this.ignoredChannelsCollectionName = config.ignoredChannelsCollectionName
        this.dbName = config.mongoDb
        this.client = client
    }

    public async isIgnored(guildId: string, channelId: string): Promise<boolean> {
        let db = this.client.db(this.dbName)
        let ignoredChannels = db.collection<IgnoredChannel>(this.ignoredChannelsCollectionName)
        let aggregation = ignoredChannels.find({ guildId: guildId, channelId: channelId })
        return aggregation.toArray()
            .then(channels => {
                let ignoredChannel = channels[0]
                return ignoredChannel !== undefined && ignoredChannel !== null
            })
    }

    public add(ignoreChannel: IgnoredChannel) {
        let db = this.client.db(this.dbName)
        let ignoredChannels = db.collection(this.ignoredChannelsCollectionName)
        ignoredChannels.insertOne(ignoreChannel, (err) => {
            if (err) console.log(`[ERROR] IgnoredChannelsRepository.add() - ${err}`)
        })
    }

    public async delete(guildId: string, channelId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let ignoredChannels = db.collection(this.ignoredChannelsCollectionName)
        return ignoredChannels.deleteOne({ guildId: guildId, channelId: channelId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log(`[ERROR] IgnoredChannelsRepository.delete(${guildId}, ${channelId})`)
                else result = true
                return result
            })
    }

    public async deleteAllGuildChannels(guildId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.ignoredChannelsCollectionName)
        return textChannels.deleteMany({ guildId: guildId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log(`[ERROR] IgnoredChannelsRepository.deleteAllGuildChannels(${guildId})`)
                else result = true
                return result
            })
    }
}