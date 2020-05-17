import { Client, Message } from "discord.js"
import { Logger } from "./handlers/Logger"
import { TestHandlers } from "./handlers/TestHandlers"
import { ChannelOperator } from "./handlers/ChannelOperator"
import { ClientEvent } from "./enums/ClientEvent"
import { ProcessEvent } from "./enums/ProcessEvent"

export class EventRegistry {
    private client: Client
    private config: any

    private logger: Logger
    private testHandlers: TestHandlers
    private channelOperator: ChannelOperator

    constructor(client: Client, config: any) {
        this.client = client
        this.config = config

        this.testHandlers = new TestHandlers(client, config)
        this.logger = new Logger()
        this.channelOperator = new ChannelOperator(client, config)
    }

    public registerEvents() {
        // => Log bot started and listening
        this.registerReadyHandler()

        // => Check bot is alive
        this.registerPing()
        this.registerVoiceUpdateHandler()

        // => Bot error and warn handler
        this.client.on(ClientEvent.Error, this.logger.logError)
        this.client.on(ClientEvent.Warn, this.logger.logWarn)

        // => Process handler
        this.registerProcessHandlers()
    }

    private registerReadyHandler() {
        this.client.on(ClientEvent.Ready, () => {
            this.logger.introduce(this.client, this.config.settings.activity);
        });
    }

    private registerPing() {
        this.client.on(ClientEvent.Message, (message: Message) => {
            this.testHandlers.handlePing(message)
        })
    }

    private registerVoiceUpdateHandler() {
        this.client.on(ClientEvent.VoiceStateUpdate, (oldVoiceState, newVoiceState) => {
            if (newVoiceState.channelID !== oldVoiceState.channelID) {
                if(newVoiceState.channelID !== undefined) this.channelOperator.handleChannelJoin(newVoiceState)
                if(oldVoiceState.channelID !== undefined) this.channelOperator.handleChannelLeave(oldVoiceState)
            }
        });
    }

    private registerProcessHandlers() {
        process.on(ProcessEvent.Exit, () => {
            this.logger.logEvent(`[${this.config.settings.nameBot}] Process exit.`)
            this.client.destroy()
        })

        process.on(ProcessEvent.UncaughtException, (err: Error) => {
            const errorMsg = (err ? err.stack || err : '').toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
            this.logger.logError(errorMsg)
        })

        process.on(ProcessEvent.UnhandledRejection, (reason: {} | null | undefined) => {
            this.logger.logError(`Uncaught Promise rejection: ${reason}`)
        })
    }
}