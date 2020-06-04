import { Client, Message, PartialMessage } from "discord.js"
import { Logger } from "./handlers/Logger"
import { ChannelOperator } from "./handlers/ChannelOperator"
import { ClientEvent } from "./enums/ClientEvent"
import { ProcessEvent } from "./enums/ProcessEvent"
import { Config } from "./config"
import { InfoHandlers } from "./handlers/InfoHandlers"
import { MongoConnector } from "./db/MongoConnector"

export class EventRegistry {
    private client: Client
    private config: Config

    private logger: Logger
    private channelOperator: ChannelOperator
    private infoHandlers: InfoHandlers

    constructor(client: Client, config: Config) {
        this.client = client
        this.config = config

        let mongoConnector = new MongoConnector(config)

        this.logger = new Logger()
        this.channelOperator = new ChannelOperator(mongoConnector, config, this.logger)
        this.infoHandlers = new InfoHandlers(config)
    }

    public registerEvents() {
        // => Log bot started and listening
        this.registerReadyHandler()

        // => Main worker handlers
        this.registerMessageHandler()
        this.registerMessageUpdateHandler()
        this.registerVoiceUpdateHandler()

        // => Bot error and warn handlers
        this.client.on(ClientEvent.Error, this.logger.logError)
        this.client.on(ClientEvent.Warn, this.logger.logWarn)

        // => Process handlers
        this.registerProcessHandlers()
    }

    // ---------------- //
    //  Event Handlers  //
    // ---------------- //

    private registerReadyHandler() {
        !
            this.client.once(ClientEvent.Ready, () => {
                this.logger.introduce(this.client, this.config);
            });
    }

    private registerMessageHandler() {
        this.client.on(ClientEvent.Message, (message: Message) => {
            this.configCommandHandlers(message)
        })
    }

    private registerMessageUpdateHandler() {
        this.client.on(ClientEvent.MessageUpdate, (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
            if((newMessage as Message).type) this.configCommandHandlers(newMessage as Message)
        })
    }

    private registerVoiceUpdateHandler() {
        this.client.on(ClientEvent.VoiceStateUpdate, (oldVoiceState, newVoiceState) => {
            if (newVoiceState.channelID !== oldVoiceState.channelID) {
                if (newVoiceState.channelID !== undefined) this.channelOperator.handleChannelJoin(newVoiceState)
                if (oldVoiceState.channelID !== undefined) this.channelOperator.handleChannelLeave(oldVoiceState)
            }
        });
    }

    private registerProcessHandlers() {
        process.on(ProcessEvent.Exit, () => {
            const msg = `[Illuminati-bot] Process exit.`
            this.logger.logEvent(msg)
            console.log(msg)
            this.client.destroy()
        })

        process.on(ProcessEvent.UncaughtException, (err: Error) => {
            const errorMsg = (err ? err.stack || err : '').toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
            this.logger.logError(errorMsg.substring(0, 500))
            console.log(errorMsg.substring(0, 500))
        })

        process.on(ProcessEvent.UnhandledRejection, (reason: {} | null | undefined) => {
            const msg = `Uncaught Promise rejection: ${reason}`
            this.logger.logError(msg.substring(0, 500))
            console.log(msg.substring(0, 500))
        })
    }

    private configCommandHandlers(message: Message) {
        this.infoHandlers.handleHelpCall(message)
    }
}