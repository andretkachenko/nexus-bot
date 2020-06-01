import { MongoClient } from "mongodb";
import { Config } from "../config";
import { IntroMap } from "../entities/IntroMap";

export class IntroRepository {
    private client: MongoClient
    private introCollectionName: string
    private dbName: string

    constructor(client: MongoClient, config: Config) {
        this.client = client;
        this.dbName = config.mongoDb
        this.introCollectionName = config.introCollectionName
    }

    public async get(guildId: string, channelId: string): Promise<IntroMap | undefined> {
        let introMap: IntroMap | undefined
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        let aggregation = introMaps.find({ GuildId: guildId, ChannelId: channelId })
        return aggregation.toArray()
        .then(introMaps => {
            introMap = introMaps[0]
            return introMap
        })
    }

    public add(introMap: IntroMap) {
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        introMaps.insertOne(introMap, (err) => {
            if (err) console.log(err)
            console.log("document inserted")
        })
    }

    public update(introMap: IntroMap) {
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        introMaps.updateOne({ GuildId: introMap.GuildId, ChannelId: introMap.ChannelId }, { $set: { Description: introMap.Description, ImageUrl: introMap.ImageUrl, AdditionalUrl: introMap.AdditionalUrl } }, (err) => {
            if (err) console.log(err)
            else console.log("document updated")
        })
    }

    public async delete(guildId: string, voiceChannelId: string) {
        let db = this.client.db(this.dbName)
        let introMaps = db.collection(this.introCollectionName)
        introMaps.deleteOne({ GuildId: guildId, ChannelId: voiceChannelId }, (err) => {
            if (err) console.log(err)
            console.log("document deleted")
        })
    }
}