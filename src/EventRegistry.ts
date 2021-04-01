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

        let mongoConnector = new MongoConnector(config)

        this.logger = new Logger()
        this.channelHandlers = new ChannelHandlers(mongoConnector, this.logger, client)
        this.userCommandHandlers = new UserCommandHandlers(client, mongoConnector, config)
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
        this.client.on(ClientEvent.Error, this.logger.logError)
        this.client.on(ClientEvent.Warn, this.logger.logWarn)

        // => Process handlers
        this.handleProcessEvents()
    }

    // ---------------- //
    //  Event Handlers  //
    // ---------------- //

    private handleReady() {
        !
            this.client.once(ClientEvent.Ready, () => {
                this.logger.introduce(this.client, this.config)
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
            const msg = `[ERROR] Process exit.`
            this.logger.logEvent(msg)
            console.log(msg)
            this.client.destroy()
        })

        process.on(ProcessEvent.UncaughtException, (err: Error) => {
            const errorMsg = (err ? err.stack || err : '').toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
            const msg = "[ERROR] " + errorMsg
            this.logger.logError(msg)
            console.log(msg)
        })

        process.on(ProcessEvent.UnhandledRejection, (reason: {} | null | undefined) => {
            const msg = `[ERROR] Uncaught Promise rejection: ${reason}`
            this.logger.logError(msg)
            console.log(msg)
        })
    }
}