import { Config } from '../config'
import { MongoClient } from 'mongodb'
import { Repository } from './Repository'
import { IGuildRelated } from '../entities'
import {
	IgnoredChannelsRepository,
	SkippedRolesRepository,
	SkippedUsersRepository,
	TextCategoriesRepository,
	TextChannelMapsRepository
} from '.'
import { Logger } from '../Logger'

export class MongoConnector {
	private client: MongoClient

	public repositories: Repository<IGuildRelated>[]
	public textChannelRepository: TextChannelMapsRepository
	public textCategoryRepository: TextCategoriesRepository
	public ignoredChannels: IgnoredChannelsRepository
	public skippedUsers: SkippedUsersRepository
	public skippedRoles: SkippedRolesRepository

	constructor(config: Config, logger: Logger) {
		const uri = `mongodb+srv://${config.mongoName}:${config.mongoPassword}@${config.mongoCluster}`
		this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

		this.client.connect((err) => {
			if (err) {
				logger.logError(this.constructor.name, this.constructor.name, err.message)
				return
			}
		})

		this.textChannelRepository = new TextChannelMapsRepository(logger, this.client, config.mongoDb)
		this.textCategoryRepository = new TextCategoriesRepository(logger, this.client, config.mongoDb)
		this.ignoredChannels = new IgnoredChannelsRepository(logger, this.client, config.mongoDb)
		this.skippedUsers = new SkippedUsersRepository(logger, this.client, config.mongoDb)
		this.skippedRoles = new SkippedRolesRepository(logger, this.client, config.mongoDb)

		// add repository to this arrray for auto clearance at GuildDelete event
		this.repositories = [
			this.textChannelRepository,
			this.textCategoryRepository,
			this.ignoredChannels,
			this.skippedUsers,
			this.skippedRoles,
		]
	}
}