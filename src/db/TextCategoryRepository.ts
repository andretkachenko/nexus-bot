import { MongoClient } from "mongodb";
import { Config } from "../config";
import { TextCategoryMap } from "../entities/TextCategoryMap"; 

export class TextCategoryRepository {
    private client: MongoClient
    private textCategoryCollectionName: string
    private dbName: string

    constructor(client: MongoClient, config: Config) {
        this.client = client;
        this.dbName = config.mongoDb
        this.textCategoryCollectionName = config.textCategoryCollectionName
    }

    public async getId(guildId: string): Promise<string> {
        let textCategoryId: string = ''
        let db = this.client.db(this.dbName);
        let textCategories = db.collection<TextCategoryMap>(this.textCategoryCollectionName);        
        let aggregation = textCategories.find({ guildId: guildId })
        return aggregation.toArray()
            .then(textCategoryMaps => {
                let textCategoryMap = textCategoryMaps[0];
                if (textCategoryMap !== undefined) textCategoryId = textCategoryMap.textCategoryId
                return textCategoryId
            })
    }

    public add(textCategoryMap: TextCategoryMap) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textCategoryCollectionName)
        textChannels.insertOne(textCategoryMap, (err) => {
            if (err) console.log(err)
            console.log("document inserted")
        })
    }

    public delete(guildId: string) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textCategoryCollectionName)
        textChannels.deleteOne({ GuildId: guildId }, (err) => {
            if (err) console.log(err)
            console.log("document deleted")
        })
    }
}