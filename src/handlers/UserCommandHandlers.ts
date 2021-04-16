import {
	Client,
	Message
} from 'discord.js'
import { MongoConnector } from '../db/MongoConnector'
import {
	BaseHandler,
	ChannelId,
	Commands,
	Help,
	IgnoreChannel,
	IHandler,
	MapChannels,
	Ping,
	Preserve,
	SkipUsersRoles,
	Whoops,
	Write
} from './userCommands'
import { Config } from '../config'
import { Logger } from '../Logger'

export class UserCommandHandlers {
	private readonly cmdHandlingChain: IHandler
	private readonly docs: Record<string, IHandler>

	constructor(client: Client, logger: Logger, mongoConnector: MongoConnector, config: Config) {

		const handlers: BaseHandler[] = [
			new Help(logger, config, this),
			new Ping(logger, config),
			new Write(logger, config),
			new Preserve(logger, mongoConnector, config),
			new IgnoreChannel(logger, client, mongoConnector, config),
			new SkipUsersRoles(logger, mongoConnector, config),
			new MapChannels(logger, client, mongoConnector, config)
		]
		this.cmdHandlingChain = this.chain(handlers)

		handlers.push(
			new ChannelId(logger, config),
			new Commands(logger, config),
			new Whoops(logger, config)
		)
		this.docs = {}
		handlers.forEach(handler => this.docs[handler.cmd] = handler)
	}

	public handle(message: Message): void {
		if (message.author.bot) return
		this.cmdHandlingChain.handle(message)
	}

	public getDocHandler(type: string): IHandler {
		return this.docs[type]
	}

	private chain(handlers: IHandler[]): IHandler {
		let current: IHandler | undefined
		for(const handler of handlers) {
			if(current) current.setNext(handler)
			current = handler
		}

		return handlers[0]
	}
}