import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../config'
import { Permission } from '../../enums'
import { Logger } from '../../Logger'
import { IHandler } from './.'

export abstract class BaseHandler implements IHandler {
	private nextHandler!: IHandler
	protected logger: Logger
	public readonly cmd: string
	protected readonly prefix: string
	protected readonly img: string

	constructor(logger: Logger, config: Config, cmd : string) {
		this.logger = logger
		this.cmd = cmd
		this.prefix = config.prefix
		this.img = config.img
	}

	protected abstract process(message: Message): void
	public abstract fillEmbed(embed: MessageEmbed): void

	public setNext(handler: IHandler): IHandler {
		this.nextHandler = handler
		return handler
	}

	public handle(message: Message): void {
		if (message.content.includes(this.prefix + this.cmd) && this.hasPermissions(message)) {
			return this.process(message)
		}
		if (this.nextHandler) return this.nextHandler.handle(message)
	}

	protected hasPermissions(message: Message): boolean {
		return message.member !== null && message.member.hasPermission(Permission.manageRoles, { checkAdmin: true, checkOwner: true})
	}

	protected splitArguments(message: string): string[] {
		return message.replace(/\s+/g, ' ').trim().split(' ')
	}

	protected trimCommand(message: Message): string {
		return message.content.substring(this.prefix.length + this.cmd.length + 1)
	}
}