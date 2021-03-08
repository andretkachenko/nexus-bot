import {
    Client,
    Message
} from "discord.js"
import { MongoConnector } from "../db/MongoConnector"
import { IHandler } from "./userCommands/IHandler"
import {
    Help,
    IgnoreChannel,
    Ping,
    Preserve,
    SkipUsersRoles,
    Write
} from "./userCommands"
import { Config } from "../config"

export class UserCommandHandlers {
    private readonly handler: IHandler

    constructor(client: Client, mongoConnector: MongoConnector, config: Config) {
        this.handler = new Help(config)
        this.handler
            .setNext(new Ping(config.prefix))
            .setNext(new Write(config.prefix))
            .setNext(new Preserve(mongoConnector, config.prefix))
            .setNext(new IgnoreChannel(client, mongoConnector, config.prefix))
            .setNext(new SkipUsersRoles(mongoConnector, config.prefix))
    }

    public handle(message: Message) {
        if (message.author.bot) return
        this.handler.handle(message)
    }
}