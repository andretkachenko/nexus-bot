import { Client } from 'discord.js'
import { Logger } from './handlers/Logger'
import { EventRegistry } from "./EventRegistry"
import { Config } from './config'

export class Bot {
	private client: Client
	private config: Config
	private logger: Logger
	private eventRegistry: EventRegistry

	constructor() {
		this.client = new Client()
		this.logger = new Logger()
		this.config = new Config()
		this.eventRegistry = new EventRegistry(this.client, this.config)
	}

	public start(): void {
		this.logger.logSystem('Starting bot...')
		
		// register all event handlers
		this.eventRegistry.registerEvents()
		this.client.login(this.config.token)
	}
}