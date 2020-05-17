import { Client, Message, VoiceState, TextChannel, GuildMember, GuildChannelManager } from 'discord.js'
import * as path from 'path'
import * as YAML from 'yamljs'

import { Logger } from './handlers/Logger'
import { EventRegistry } from "./EventRegistry"

export class Bot {
	private client: Client
	private config: any
	private logger: Logger
	private eventRegistry: EventRegistry

	constructor() {
		this.client = new Client()
		this.config = YAML.load(path.resolve(__dirname, 'config.yml'))
		this.logger = new Logger()
		this.eventRegistry = new EventRegistry(this.client, this.config)
	}

	public start(): void {
		this.logger.logSystem('Starting bot...')
		
		// register all event handlers
		this.eventRegistry.registerEvents()

		
		this.client.login(process.env.TOKEN)
	}
}