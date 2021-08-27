import { Client, Intents } from 'discord.js'
import { Logger } from './Logger'
import { EventRegistry } from './EventRegistry'
import { Config } from './Config'
import { Messages } from './descriptor'
import { PingSlash } from './handlers/userCommands/PingSlash'
import { REST } from '@discordjs/rest'

export class Bot {
	private client: Client
	private config: Config
	private logger: Logger
	private eventRegistry: EventRegistry

	constructor() {
		this.client = new Client({ intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.DIRECT_MESSAGES
		]})
		this.logger = new Logger()
		this.config = new Config()
		this.eventRegistry = new EventRegistry(this.client, this.config)
	}

	public start(): void {
		this.logger.logSystem(Messages.startingBot)

		const commands = []
		commands.push(new PingSlash().data.toJSON())

		const rest = new REST({ version: '9' }).setToken(this.config.token)

		rest.put(`/applications/${this.config.applicationId}/guilds/722491063662673946/commands`, { body: commands })
			.catch(reason => this.logger.logError(this.constructor.name, this.start.name, reason))

		// register all event handlers
		this.eventRegistry.registerEvents()
		this.client.login(this.config.token)
			.catch(reason => this.logger.logError(this.constructor.name, this.start.name, reason))
	}
}