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
	public readonly cmdWord: string
	protected readonly prefix: string
	protected readonly img: string
	protected readonly cmd: string

	constructor(logger: Logger, config: Config, cmd : string) {
		this.logger = logger
		this.cmdWord = cmd
		this.prefix = config.prefix
		this.img = config.img
		this.cmd = this.prefix + this.cmdWord
	}

	protected abstract process(message: Message): void
	public abstract fillEmbed(embed: MessageEmbed): void

	public setNext(handler: IHandler): IHandler {
		this.nextHandler = handler
		return handler
	}

	public handle(message: Message): void {
		const content = message.content.toLocaleLowerCase()
		if (content.startsWith(this.cmd.toLocaleLowerCase()) && this.hasPermissions(message)) {
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
		return message.content.substring(this.cmd.length + 1)
	}
}