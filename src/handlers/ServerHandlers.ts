import { Guild } from 'discord.js'
import { MongoConnector } from '../db/MongoConnector'
import { Logger } from '../Logger'

export class ServerHandlers {
	private logger: Logger
	private mongoConnector: MongoConnector

	constructor(logger: Logger, mongoConnector: MongoConnector) {
		this.logger = logger
		this.mongoConnector = mongoConnector
	}

	public handleBotKickedFromServer(guild: Guild): void {
		this.mongoConnector.repositories.forEach(repo => {
			repo.deleteForGuild(guild.id)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleBotKickedFromServer.name, reason, repo.constructor.name))
		})
	}
}