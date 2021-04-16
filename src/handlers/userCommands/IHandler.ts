import { Message,
	MessageEmbed
} from 'discord.js'

export interface IHandler {
	setNext(handler: IHandler): IHandler

	handle(message: Message): void
	fillEmbed(embed: MessageEmbed): void
}