import { MongoClient } from "mongodb";
import { Config } from "../config";
import { TextChannelMap } from "../entities/TextChannelMap";

export class TextChannelRepository {
    private client: MongoClient
    private textChannelCollectionName: string
    private dbName: string

    constructor(client: MongoClient, config: Config) {
        this.client = client;
        this.dbName = config.mongoDb
        this.textChannelCollectionName = config.textChannelCollectionName
    }

    public async getTextChannelMap(guildId: string, channelId: string): Promise<TextChannelMap> {
        let textChannelMap: TextChannelMap
        let db = this.client.db(this.dbName);
        let textChannels = db.collection<TextChannelMap>(this.textChannelCollectionName);
        let aggregation = textChannels.find({ guildId: guildId, voiceChannelId: channelId })
        return aggregation.toArray()
            .then(textChannelMaps => {
                textChannelMap = textChannelMaps[0]
                return textChannelMap
            })
    }

    public async deleteAllGuildChannels(guildId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        return textChannels.deleteMany({ guildId: guildId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log(`[ERROR] TextChannelRepository.deleteAllGuildChannels(${guildId})`)
                else {
                    result = true
                }
                return result
            })
    }

    public async add(textChannelMap: TextChannelMap): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        return textChannels.insertOne(textChannelMap)
            .then((insertResult) => {
                if (insertResult.result.ok !== 1) console.log("[ERROR] TextChannelRepository.add()")
                else {
                    result = true
                }
                return result
            })
    }

    public async delete(guildId: string, voiceChannelId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        return textChannels.deleteOne({ guildId: guildId, voiceChannelId: voiceChannelId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log(`[ERROR] TextChannelRepository.delete(guildId: ${guildId}, voiceChannelId: ${voiceChannelId})`)
                else {
                    result = true
                }
                return result
            })
    }

    public async setPreserveOption(textChannelMap: TextChannelMap): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        return textChannels.updateOne({
            guildId: textChannelMap.guildId,
            voiceChannelId: textChannelMap.voiceChannelId
        }, {
            $set: {
                preserve: textChannelMap.preserve
            }
        })
            .then((insertResult) => {
                if (insertResult.result.ok !== 1) console.log(`[ERROR] TextChannelRepository.setPreserveOption({ guildId: ${textChannelMap.guildId}, voiceChannelId: ${textChannelMap.voiceChannelId} })`)
                else {
                    result = true
                }
                return result
            })
    }
}