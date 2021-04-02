import {
    Client,
    Message,
    PartialMessage
} from "discord.js"
import { Logger } from "./Logger"
import { Config } from "./config"
import { MongoConnector } from "./db/MongoConnector"
import {
    ChannelHandlers,
    ServerHandlers,
    UserCommandHandlers
} from "./handlers"
import {
    ClientEvent,
    ProcessEvent
} from "./enums"
import { 
    Messages,
    Constants 
} from "./descriptor"

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

        let mongoConnector = new MongoConnector(config, this.logger)        
        this.channelHandlers = new ChannelHandlers(mongoConnector, this.logger, client)
        this.userCommandHandlers = new UserCommandHandlers(client, this.logger, mongoConnector, config)
        this.serverHandlers = new ServerHandlers(mongoConnector)
    }

    public registerEvents() {
        // => Log bot started and listening
        this.handleReady()

        // => Main worker handlers
        this.handleMessage()
        this.handeMessageUpdate()
        this.handeVoiceStateUpdate()
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
        !
            this.client.once(ClientEvent.Ready, () => { 
                this.introduce(this.client, this.config)
            })
    }

    private handleMessage() {
        this.client.on(ClientEvent.Message, (message: Message) => {
            this.userCommandHandlers.handle(message)
        })
    }

    private handeMessageUpdate() {
        this.client.on(ClientEvent.MessageUpdate, (_oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) => {
            let newMessage = newMsg as Message
            if (newMessage.type) this.userCommandHandlers.handle(newMessage)
        })
    }

    private handeVoiceStateUpdate() {
        this.client.on(ClientEvent.VoiceStateUpdate, (oldVoiceState, newVoiceState) => {
            if (newVoiceState.channelID !== oldVoiceState.channelID) {
                if (newVoiceState.channelID) this.channelHandlers.handleChannelJoin(newVoiceState)
                if (oldVoiceState.channelID) this.channelHandlers.handleChannelLeave(oldVoiceState)
            }
        })
    }

    private handleGuildDelete() {
        this.client.on(ClientEvent.GuildDelete, guild => {
            this.serverHandlers.handleBotKickedFromServer(guild)
        })
    }

    private handleProcessEvents() {
        process.on(ProcessEvent.Exit, () => {
            const msg = Messages.ProcessExit
            this.logger.logEvent(msg)
            this.client.destroy()
        })

        process.on(ProcessEvent.UncaughtException, (error: Error) => this.handleError(error))

        process.on(ProcessEvent.UnhandledRejection, (reason: {} | null | undefined) => {
            this.logger.logError(this.constructor.name, this.handleProcessEvents.name, Messages.UnhandledRejection + ": " + reason)
        })
    }

    private handleClientErrorsAndWarnings() {
        this.client.on(ClientEvent.Error, (error: Error) => this.handleError(error))

        this.client.on(ClientEvent.Warn, (warning) => {
            this.logger.logWarn(Messages.DiscordWarn + ": " + warning)
        })
    }

    private handleError(err: Error) {
        const errorMsg = (err ? err.stack || err : Constants.EmptyString).toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
        this.logger.logError(this.constructor.name, this.handleError.name, errorMsg)
    }

	public introduce(client: Client, config: Config) {
		this.logger.logEvent(Messages.BotConnected)
		this.logger.logEvent(Messages.LoggedAs + (client.user ? client.user.tag : Constants.Undefined))
		try
		{
			if(client.user) client.user.setActivity({ 
                "name": Messages.StatusString(config.prefix, client.guilds.cache.size), 
                "type": Constants.Listening 
            })
		}
		catch(error) {
			this.logger.logError(this.constructor.name, this.introduce.name, error)
		}
	}
}