import {
	Client,
	Message,
	PartialMessage
} from 'discord.js'
import { Logger } from './Logger'
import { Config } from './config'
import { MongoConnector } from './db/MongoConnector'
import {
	ChannelHandlers,
	ServerHandlers,
	UserCommandHandlers
} from './handlers'
import {
	ClientEvent,
	ProcessEvent
} from './enums'
import {
	Messages,
	Constants
} from './descriptor'

export class EventRegistry {
	private client: Client
	private config: Config

	private logger: Logger
	private userCommandHandlers: UserCommandHandlers
	private channelHandlers: ChannelHandlers
	private serverHandlers: ServerHandlers

	constructor(client: Client, config: Config) {
		this.client = client
		this.config = config
		this.logger = new Logger()

		const mongoConnector = new MongoConnector(config, this.logger)
		this.channelHandlers = new ChannelHandlers(mongoConnector, this.logger, client)
		this.userCommandHandlers = new UserCommandHandlers(client, this.logger, mongoConnector, config)
		this.serverHandlers = new ServerHandlers(this.logger, mongoConnector)
	}

	public registerEvents(): void {
		// => Log bot started and listening
		this.handleReady()

		// => Main worker handlers
		this.handleMessage()
		this.handeMessageUpdate()
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
			this.introduce(this.client, this.config)
		})
	}

	private handleMessage() {
		this.client.on(ClientEvent.message, (message: Message) => {
			this.userCommandHandlers.handle(message)
		})
	}

	private handeMessageUpdate() {
		this.client.on(ClientEvent.messageUpdate, (_oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) => {
			const newMessage = newMsg as Message
			if (newMessage.type) this.userCommandHandlers.handle(newMessage)
		})
	}

	private handeVoiceStateUpdate() {
		this.client.on(ClientEvent.voiceStateUpdate, (oldVoiceState, newVoiceState) => {
			if (newVoiceState.channelID !== oldVoiceState.channelID) {
				if (newVoiceState.channelID) this.channelHandlers.handleChannelJoin(newVoiceState)
					.catch(reason => this.logger.logError(this.constructor.name, this.handeVoiceStateUpdate.name, reason))
				if (oldVoiceState.channelID) this.channelHandlers.handleChannelLeave(oldVoiceState)
					.catch(reason => this.logger.logError(this.constructor.name, this.handeVoiceStateUpdate.name, reason))
			}
		})
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

		this.client.on(ClientEvent.warn, (warning) => {
			this.logger.logWarn(Messages.discordWarn + ': ' + warning)
		})
	}

	private handleError(err: Error) {
		const errorMsg = (err ? err.stack || err : Constants.emptyString).toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
		this.logger.logError(this.constructor.name, this.handleError.name, errorMsg)
	}

	public introduce(client: Client, config: Config): void {
		this.logger.logEvent(Messages.botConnected)
		this.logger.logEvent(Messages.loggedAs + (client.user ? client.user.tag : Constants.undefinedId))
		try
		{
			if(client.user) client.user.setActivity({
				'name': Messages.statusString(config.prefix, client.guilds.cache.size),
				'type': Constants.listening
			})
				.catch(reason => this.logger.logError(this.constructor.name, this.introduce.name, reason))
		}
		catch(error) {
			this.logger.logError(this.constructor.name, this.introduce.name, error)
		}
	}
}