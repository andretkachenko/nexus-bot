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
            if(textMap !== undefined) textChannelId = textMap.textChannelId
            return textChannelId
        })
    }

    public add(textChannelMap: TextChannelMap) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        textChannels.insertOne(textChannelMap, (err) => {
            if (err) console.log(err)
            console.log("document inserted")
        })
    }

    public delete(guildId: string, voiceChannelId: string) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textChannelCollectionName)
        textChannels.deleteOne({ GuildId: guildId, ChannelId: voiceChannelId }, (err) => {
            if (err) console.log(err)
            console.log("document deleted")
        })
    }
}