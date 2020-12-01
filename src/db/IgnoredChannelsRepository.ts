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
        let db = this.client.db(this.dbName);
        let ignoredChannels = db.collection<IgnoredChannel>(this.ignoredChannelsCollectionName);
        let aggregation = ignoredChannels.find({ guildId: guildId, channelId: channelId })
        return aggregation.toArray()
            .then(channels => {
                let ignoredChannel = channels[0];
                return ignoredChannel !== undefined && ignoredChannel !== null
            })
    }

    public add(auditChannel: IgnoredChannel) {
        let db = this.client.db(this.dbName)
        let ignoredChannels = db.collection(this.ignoredChannelsCollectionName)
        ignoredChannels.insertOne(auditChannel, (err) => {
            if (err) console.log(err)
            console.log("document inserted")
        })
    }

    public async delete(guildId: string, channelId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let ignoredChannels = db.collection(this.ignoredChannelsCollectionName)
        return ignoredChannels.deleteOne({ guildId: guildId, channelId: channelId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log("command not executed correctly: document not deleted")
                else {
                    console.log("document deleted")
                    result = true
                }
                return result
            })
    }
}