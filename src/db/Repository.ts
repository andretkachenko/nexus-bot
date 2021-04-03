import {
	FilterQuery,
	MongoClient,
	UpdateQuery
} from 'mongodb'
import { Constants } from '../descriptor'
import { IGuildRelated } from '../entities'
import { Logger } from '../Logger'

type TSchema = any

export class Repository<TEntity extends IGuildRelated> {
	private client: MongoClient
	private dbName: string
	protected collectionName!: string
	private logger: Logger

	constructor(logger: Logger, client: MongoClient, dbName: string) {
		this.logger = logger
		this.client = client
		this.dbName = dbName
		this.collectionName = this.constructor.name.replace(Constants.repository, Constants.emptyString)
	}

	protected async getFirst(filter: FilterQuery<TSchema>): Promise<TEntity> {
		let entity: TEntity
		const db = this.client.db(this.dbName)
		const textChannels = db.collection<TEntity>(this.collectionName)
		const filtered = textChannels.find(filter)
		return filtered.toArray()
			.then(aggregation => {
				entity = aggregation[0]
				return entity
			})
	}

	protected async getMany(filter: FilterQuery<TSchema>): Promise<TEntity[]> {
		const db = this.client.db(this.dbName)
		const textChannels = db.collection<TEntity>(this.collectionName)
		const aggregation = textChannels.find(filter)
		return aggregation.toArray()
	}

	public async insert(entity: TEntity): Promise<boolean> {
		let success = false
		const db = this.client.db(this.dbName)
		const collection = db.collection(this.collectionName)
		return collection.insertOne(entity)
			.then((result) => {
				if (result.result.ok !== 1) this.logger.logError(this.constructor.name, this.insert.name, Constants.emptyString)
				else {
					success = true
				}
				return success
			})
	}

	protected async update(filter: FilterQuery<TSchema>, update: UpdateQuery<TSchema>): Promise<boolean> {
		let success = false
		const db = this.client.db(this.dbName)
		const collection = db.collection(this.collectionName)
		return collection.updateOne(filter, update)
			.then((result) => {
				if (result.result.ok !== 1) this.logger.logError(this.constructor.name, this.update.name, Constants.emptyString)
				else {
					success = true
				}
				return success
			})
	}

	protected async deleteOne(filter: FilterQuery<TSchema>): Promise<boolean> {
		let success = false
		const db = this.client.db(this.dbName)
		const collection = db.collection(this.collectionName)
		return collection.deleteOne(filter)
			.then((result) => {
				if (result.result.ok !== 1) this.logger.logError(this.constructor.name, this.deleteOne.name, Constants.emptyString)
				else {
					success = true
				}
				return success
			})
	}

	public async deleteForGuild(guildId: string): Promise<boolean> {
		let result = false
		const db = this.client.db(this.dbName)
		const collection = db.collection(this.collectionName)
		return collection.deleteMany({ guildId })
			.then((deleteResult) => {
				if (deleteResult.result.ok !== 1) this.logger.logError(this.constructor.name, this.deleteForGuild.name, Constants.emptyString)
				else {
					result = true
				}
				return result
			})
	}
}