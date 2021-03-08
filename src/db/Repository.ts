import {
    FilterQuery,
    MongoClient,
    UpdateQuery
} from "mongodb"
import { IGuildRelated } from "../entities"

type TSchema = any

export class Repository<TEntity extends IGuildRelated> {
    private client: MongoClient
    private dbName: string
    protected collectionName!: string

    constructor(client: MongoClient, dbName: string) {
        this.client = client
        this.dbName = dbName
        this.collectionName = this.constructor.name.replace('Repository', '')
    }

    protected async getFirst(filter: FilterQuery<TSchema>): Promise<TEntity> {
        let entity: TEntity
        let db = this.client.db(this.dbName)
        let textChannels = db.collection<TEntity>(this.collectionName)
        let aggregation = textChannels.find(filter)
        return aggregation.toArray()
            .then(aggregation => {
                entity = aggregation[0]
                return entity
            })
    }

    protected async getMany(filter: FilterQuery<TSchema>): Promise<TEntity[]> {
        let db = this.client.db(this.dbName)
        let textChannels = db.collection<TEntity>(this.collectionName)
        let aggregation = textChannels.find(filter)
        return aggregation.toArray()
    }

    public async insert(entity: TEntity): Promise<boolean> {
        let success = false
        let db = this.client.db(this.dbName)
        let collection = db.collection(this.collectionName)
        return collection.insertOne(entity)
            .then((result) => {
                if (result.result.ok !== 1) console.log(`[ERROR] ${this.constructor.name}.insert()`)
                else {
                    success = true
                }
                return success
            })
    }

    protected async update(filter: FilterQuery<TSchema>, update: UpdateQuery<TSchema>): Promise<boolean> {
        let success = false
        let db = this.client.db(this.dbName)
        let collection = db.collection(this.collectionName)
        return collection.updateOne(filter, update)
            .then((result) => {
                if (result.result.ok !== 1) console.log(`[ERROR] ${this.constructor.name}.update()`)
                else {
                    success = true
                }
                return success
            })
    }

    protected async deleteOne(filter: FilterQuery<TSchema>): Promise<boolean> {
        let success = false
        let db = this.client.db(this.dbName)
        let collection = db.collection(this.collectionName)
        return collection.deleteOne(filter)
            .then((result) => {
                if (result.result.ok !== 1) console.log(`[ERROR] ${this.constructor.name}.deleteOne(${filter})`)
                else {
                    success = true
                }
                return success
            })
    }

    public async deleteForGuild(guildId: string): Promise<boolean> {
        let result = false
        let db = this.client.db(this.dbName)
        let collection = db.collection(this.collectionName)
        return collection.deleteMany({ guildId: guildId })
            .then((deleteResult) => {
                if (deleteResult.result.ok !== 1) console.log(`[ERROR] ${this.constructor.name}.deleteForGuild(${guildId})`)
                else {
                    result = true
                }
                return result
            })
    }
}