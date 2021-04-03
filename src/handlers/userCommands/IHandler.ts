import { Message } from 'discord.js'

export interface IHandler {
	setNext(handler: IHandler): IHandler

	handle(message: Message): void
}