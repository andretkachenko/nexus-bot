import { Client, Intents } from 'discord.js'
import { Logger } from './Logger'
import { EventRegistry } from './EventRegistry'
import { Config } from './Config'
import { Messages } from './descriptor'
import { REST } from '@discordjs/rest'
import { IHandler } from './handlers/userCommands'
import { MongoConnector } from './db'

export class Bot {
	private client: Client
	private config: Config
	private logger: Logger
	private eventRegistry: EventRegistry
	private mongoConnector: MongoConnector

	constructor() {
		this.client = new Client({ intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.DIRECT_MESSAGES
		]})
		this.logger = new Logger()
		this.config = new Config()
		this.mongoConnector = new MongoConnector(this.config, this.logger)
		this.eventRegistry = new EventRegistry(this.client, this.config, this.mongoConnector)
	}

	public start(): void {
		this.logger.logSystem(Messages.startingBot)

		const cmdHandlers : Map<string, IHandler> = new Map()
		const commands = []
		const handlers = IHandler.getImplementations()
		for (const handler of handlers) {
			const instance = new handler(this.client, this.logger, this.config, this.mongoConnector)
			commands.push(instance.slash.toJSON())
			cmdHandlers.set(instance.cmd, instance)
		}

		this.eventRegistry.setCommands(cmdHandlers)

		const rest = new REST({ version: '9' }).setToken(this.config.token)

		// for testing changes in the slash commands immediately
		// global commands will be 100% available in 1 hour after the registration
		rest.put(`/applications/${this.config.applicationId}/guilds/${this.config.testServer}/commands`, { body: commands })
			.catch(reason => this.logger.logError(this.constructor.name, this.start.name, reason))

		rest.put(`/applications/${this.config.applicationId}/commands`, { body: commands })
			.catch(reason => this.logger.logError(this.constructor.name, this.start.name, reason))

		// register all event handlers
		this.eventRegistry.registerEvents()
		this.client.login(this.config.token)
			.catch(reason => this.logger.logError(this.constructor.name, this.start.name, reason))
	}
}