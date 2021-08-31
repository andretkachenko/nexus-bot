import {
	Client,
	Interaction,
	VoiceState
} from 'discord.js'
import { Logger } from './Logger'
import { Config } from './Config'
import { MongoConnector } from './db/MongoConnector'
import {
	ChannelHandlers,
	ServerHandlers
} from './handlers'
import {
	ClientEvent,
	ProcessEvent
} from './enums'
import {
	Messages,
	Constants
} from './descriptor'
import { IHandler } from './handlers/userCommands'

export class EventRegistry {
	private client: Client
	private config: Config

	private logger: Logger
	private channelHandlers: ChannelHandlers
	private serverHandlers: ServerHandlers
	private handlers: Map<string, IHandler>

	constructor(client: Client, config: Config, mongoConnector: MongoConnector) {
		this.client = client
		this.config = config
		this.logger = new Logger()

		this.channelHandlers = new ChannelHandlers(mongoConnector, this.logger, client)
		this.serverHandlers = new ServerHandlers(this.logger, mongoConnector)
		this.handlers = new Map()
	}

	public setCommands(handlers: Map<string, IHandler>): void {
		this.handlers = handlers
	}

	public registerEvents(): void {
		// => Log bot started and listening
		this.handleReady()

		// => Main worker handlers
		this.handleInteraction()
		this.handeVoiceStateUpdate()
		this.handleChannelDelete()
		this.handleGuildDelete()

		// => Bot error and warn handlers
		this.handleClientErrorsAndWarnings()

		// => Process handlers
		this.handleProcessEvents()
	}

	// ---------------- //
	//  Event Handlers  //
	// ---------------- //

	private handleReady() {
		this.client.once(ClientEvent.ready, () => {
			this.introduce(this.client)
		})
	}

	private handleInteraction() {
		this.client.on(ClientEvent.interactionCreate, (interaction: Interaction) => {
			if(!interaction.isCommand() || this.client.application?.commands.resolve(interaction.commandName)) return

			const handler = this.handlers.get(interaction.commandName)
			handler?.process(interaction)
		})
	}

	private handeVoiceStateUpdate() {
		this.client.on(ClientEvent.voiceStateUpdate, (oldVoiceState, newVoiceState) => {
			this.handleVoiceStateUpdate(newVoiceState, oldVoiceState)
		})
	}

	private handleVoiceStateUpdate(newVoiceState: VoiceState, oldVoiceState: VoiceState) {
		if (newVoiceState.channelId === oldVoiceState.channelId) return

		if (newVoiceState.channelId)
			this.channelHandlers.handleChannelJoin(newVoiceState)
				.catch(reason => this.logger.logError(this.constructor.name, this.handeVoiceStateUpdate.name, reason))
		if (oldVoiceState.channelId)
			this.channelHandlers.handleChannelLeave(oldVoiceState)
				.catch(reason => this.logger.logError(this.constructor.name, this.handeVoiceStateUpdate.name, reason))
	}

	private handleGuildDelete() {
		this.client.on(ClientEvent.guildDelete, guild => {
			this.serverHandlers.handleBotKickedFromServer(guild)
		})
	}

	private handleChannelDelete() {
		this.client.on(ClientEvent.channelDelete, channel => {
			this.channelHandlers.handleVoiceChannelDelete(channel)
		})
	}

	private handleProcessEvents() {
		process.on(ProcessEvent.exit, () => {
			const msg = Messages.processExit
			this.logger.logEvent(msg)
			this.client.destroy()
		})

		process.on(ProcessEvent.uncaughtException, (error: Error) => this.handleError(error))

		process.on(ProcessEvent.unhandledRejection, (reason: Error) => {
			this.logger.logError(this.constructor.name, this.handleProcessEvents.name, `${Messages.unhandledRejection} : ${reason.message} ${reason.stack ? Constants.at + reason.stack : Constants.emptyString}`)
		})
	}

	private handleClientErrorsAndWarnings() {
		this.client.on(ClientEvent.error, (error: Error) => this.handleError(error))

		this.client.on(ClientEvent.warn, (warning: string) => {
			this.logger.logWarn(Messages.discordWarn + ': ' + warning)
		})
	}

	private handleError(err: Error) {
		const errorMsg = (err ? err.stack || err : Constants.emptyString).toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
		this.logger.logError(this.constructor.name, this.handleError.name, errorMsg)
	}

	private introduce(client: Client): void {
		this.logger.logEvent(Messages.botConnected)
		this.logger.logEvent(Messages.loggedAs + (client.user ? client.user.tag : Constants.undefinedId))
		try
		{
			this.setBotActivity(client)
		}
		catch(error) {
			this.logger.logError(this.constructor.name, this.introduce.name, error as string)
		}
	}

	private setBotActivity(client: Client) {
		if (client.user)
			client.user.setActivity({
				'name': Messages.statusString(client.guilds.cache.size),
				'type': Constants.customActivity
			})
	}
}