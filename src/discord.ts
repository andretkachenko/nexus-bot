import { Client } from 'discord.js'
import { Logger } from './Logger'
import { EventRegistry } from "./EventRegistry"
import { Config } from './config'
import { Messages } from './descriptor'

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
		this.logger.logSystem(Messages.StartingBot)
		
		// register all event handlers
		this.eventRegistry.registerEvents()
		this.client.login(this.config.token)
	}
}