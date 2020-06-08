import { MongoClient, DeleteWriteOpResultObject } from "mongodb";
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

    public async getId(guildId: string, channelId: string): Promise<string> {
        let textChannelId: string = ''
        let db = this.client.db(this.dbName);
        let textChannels = db.collection(this.textChannelCollectionName);
        let aggregation = textChannels.aggregate<TextChannelMap>([
            {
                $match: {
                    guildId: guildId,
                    voiceChannelId: channelId
                },
            },
        ], {
            cursor: {
                batchSize: 1
            },
        });
        return aggregation.toArray()
            .then(textChannelMaps => {
                let textMap = textChannelMaps[0];
                if (textMap !== undefined) textChannelId = textMap.textChannelId
                return textChannelId
            })
    }

    public async add(textChannelMap: TextChannelMap): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        return textChannels.insertOne(textChannelMap)
        .then((insertResult) => {
            if (insertResult.result.ok !== 1) console.log("command not executed correctly: document not inserted")
            else {
                console.log("document inserted")
                result = true
            }
            return result
        })
    }

    public async delete(guildId: string, voiceChannelId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        return textChannels.deleteOne({ guildId: guildId, channelId: voiceChannelId })
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