import { MongoClient } from "mongodb"
import { Config } from "../config"
import { TextCategoryMap } from "../entities" 

export class TextCategoryRepository {
    private client: MongoClient
    private textCategoryCollectionName: string
    private dbName: string

    constructor(client: MongoClient, config: Config) {
        this.client = client
        this.dbName = config.mongoDb
        this.textCategoryCollectionName = config.textCategoryCollectionName
    }

    public async getId(guildId: string): Promise<string> {
        let textCategoryId: string = ''
        let db = this.client.db(this.dbName)
        let textCategories = db.collection<TextCategoryMap>(this.textCategoryCollectionName)        
        let aggregation = textCategories.find({ guildId: guildId })
        return aggregation.toArray()
            .then(textCategoryMaps => {
                let textCategoryMap = textCategoryMaps[0]
                if (textCategoryMap) textCategoryId = textCategoryMap.textCategoryId
                return textCategoryId
            })
    }

    public async add(textCategoryMap: TextCategoryMap): Promise<string> {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textCategoryCollectionName)
        return textChannels.insertOne(textCategoryMap)
        .then((insertResult) => {
            let id = ""
            if (insertResult.result.ok !== 1) console.log(`[ERROR] TextCategoryRepository.add()`)
            else {
                id = textCategoryMap.textCategoryId
            }
            return id
        })
    }

    public delete(guildId: string) {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection(this.textCategoryCollectionName)
        textChannels.deleteMany({ guildId: guildId }, (err) => {
            if (err) console.log(`[ERROR] TextCategoryRepository.delete(${guildId})`)
        })
    }
}