import { Client, Message } from "discord.js"
import { Logger } from "./handlers/Logger"
import { HealthCheckHandlers } from "./handlers/HealthCheckHandlers"
import { ChannelOperator } from "./handlers/ChannelOperator"
import { ClientEvent } from "./enums/ClientEvent"
import { ProcessEvent } from "./enums/ProcessEvent"

export class EventRegistry {
    private client: Client
    private config: any

    private logger: Logger
    private healthCheckHandlers: HealthCheckHandlers
    private channelOperator: ChannelOperator

    constructor(client: Client, config: any) {
        this.client = client
        this.config = config

        this.healthCheckHandlers = new HealthCheckHandlers(client, config)
        this.logger = new Logger()
        this.channelOperator = new ChannelOperator()
    }

    public registerEvents() {
        // => Log bot started and listening
        this.registerReadyHandler()

        // => Check bot is alive
        this.registerHealthCheck()
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

    private registerHealthCheck() {
        this.client.on(ClientEvent.Message, (message: Message) => {
            this.healthCheckHandlers.handleHealthCheck(message)
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
            const msg = `[${this.config.settings.nameBot}] Process exit.`
            this.logger.logEvent(msg)
            console.log(msg)
            //this.client.destroy()
        })

        process.on(ProcessEvent.UncaughtException, (err: Error) => {
            const errorMsg = (err ? err.stack || err : '').toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
            this.logger.logError(errorMsg)
            console.log(errorMsg)
        })

        process.on(ProcessEvent.UnhandledRejection, (reason: {} | null | undefined) => {
            const msg = `Uncaught Promise rejection: ${reason}`
            this.logger.logError(msg)
            console.log(msg)
        })
    }
}