import { SkippedUser } from "../entities/SkippedUser"
import { MongoClient } from "mongodb"

export class SkippedUsersRepository {
    private client: MongoClient
    private collectionName: string
    private dbName: string

    constructor(client: MongoClient, dbName: string) {
        this.collectionName = this.constructor.name.replace('Repository', '')
        this.dbName = dbName
        this.client = client
    }

    public async any(guildId: string, userId: string): Promise<boolean> {
        let db = this.client.db(this.dbName)
        let collection = db.collection<SkippedUser>(this.collectionName)
        let aggregation = collection.find({ guildId: guildId, userId: userId })
        return aggregation.toArray()
            .then(entities => {
                let first = entities[0]
                return first !== undefined && first !== null
            })
    }

    public insert(entity: SkippedUser) {
        let db = this.client.db(this.dbName)
        let collection = db.collection(this.collectionName)
        collection.insertOne(entity, (err) => {
            if (err) console.log(`[ERROR] ${this.constructor.name}.insert() - ${err}`)
        })
    }

    public async delete(guildId: string, userId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let ignoredChannels = db.collection(this.collectionName)
        return ignoredChannels.deleteOne({ guildId: guildId, userId: userId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log(`[ERROR] ${this.constructor.name}.delete(${guildId}, ${userId})`)
                else result = true
                return result
            })
    }

    public async deleteForGuild(guildId: string): Promise<boolean> {
        let success = false
        let db = this.client.db(this.dbName)
        let collections = db.collection(this.collectionName)
        return collections.deleteMany({ guildId: guildId })
            .then((result) => {
                if (result.result.ok !== 1) console.log(`[ERROR] ${this.constructor.name}.deleteForGuild(${guildId})`)
                else success = true
                return success
            })
    }
}