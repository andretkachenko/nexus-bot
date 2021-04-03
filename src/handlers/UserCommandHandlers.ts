import {
	Client,
	Message
} from 'discord.js'
import { MongoConnector } from '../db/MongoConnector'
import { IHandler } from './userCommands/IHandler'
import {
	Help,
	IgnoreChannel,
	Ping,
	Preserve,
	SkipUsersRoles,
	Write
} from './userCommands'
import { Config } from '../config'
import { Logger } from '../Logger'

export class UserCommandHandlers {
	private readonly handler: IHandler

	constructor(client: Client, logger: Logger, mongoConnector: MongoConnector, config: Config) {
		this.handler = new Help(logger, config)
		this.handler
			.setNext(new Ping(logger, config.prefix))
			.setNext(new Write(logger, config.prefix))
			.setNext(new Preserve(logger, mongoConnector, config.prefix))
			.setNext(new IgnoreChannel(logger, client, mongoConnector, config.prefix))
			.setNext(new SkipUsersRoles(logger, mongoConnector, config.prefix))
	}

	public handle(message: Message): void {
		if (message.author.bot) return
		this.handler.handle(message)
	}
}