import { Message } from "discord.js"
import { Permission } from "../../enums"
import { Logger } from "../../Logger"
import { IHandler } from "./IHandler"

export abstract class BaseHandler implements IHandler {
    protected logger: Logger
    private nextHandler!: IHandler
    protected readonly cmd: string

    constructor(logger: Logger, cmd: string) {
        this.logger = logger
        this.cmd = cmd
    }

    protected abstract process(message: Message): void

    public setNext(handler: IHandler): IHandler {
        this.nextHandler = handler
        return handler
    }

    public handle(message: Message) {
        if (message.content.includes(this.cmd) && this.hasPermissions(message)) {
            return this.process(message)
        }
        if (this.nextHandler) return this.nextHandler.handle(message)
    }

    protected hasPermissions(message: Message): boolean {
        return message.member !== null && message.member.hasPermission(Permission.ADMINISTRATOR)
    }

    protected splitArguments(message: string): string[] {
        return message.replace(/\s+/g, ' ').trim().split(' ')
    }

    protected trimCommand(message: Message): string {
        return message.content.substring(this.cmd.length + 1)
    }
}