import {
	Message,
	TextChannel,
	NewsChannel,
	DMChannel,
	Client
} from 'discord.js'
import {
	ChannelType,
	BotCommand
} from '../../enums'
import { MongoConnector } from '../../db/MongoConnector'
import { IgnoredChannel } from '../../entities'
import { BaseHandler } from './BaseHandler'
import { Logger } from '../../Logger'
import { Constants, Messages } from '../../descriptor'

export class IgnoreChannel extends BaseHandler {
	private client: Client
	private mongoConnector: MongoConnector

	constructor(logger: Logger, client: Client, mongoConnector: MongoConnector, prefix: string) {
		super(logger, prefix + BotCommand.ignore)
		this.mongoConnector = mongoConnector
		this.client = client
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const ignore = args[0] === Constants.enable
		const guildId = message.guild?.id as string
		for (let i = 1; i < args.length; i++) {
			this.handleChannelId(ignore, message, args[i], guildId)
		}
	}

	private handleChannelId(ignore: boolean, message: Message, channelId: string, guildId: string) {
		try {
			const isValid = this.validateChannelId(message.channel, channelId, guildId)
			if (!isValid) throw new Error(Messages.invalidChannelId)

			if (ignore) this.addIgnore(guildId, channelId)
			else this.deleteIgnore(guildId, channelId)
		}
		catch (e) {
			this.logger.logError(this.constructor.name, this.handleChannelId.name, e, channelId)
			message.channel.send(Messages.errorProcessingChannelId + channelId)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleChannelId.name, reason))
		}
	}

	private deleteIgnore(guildId: string, channelId: string) {
		this.mongoConnector.ignoredChannels.delete(guildId, channelId)
			.catch(reason => this.logger.logError(this.constructor.name, this.deleteIgnore.name, reason))
	}

	private addIgnore(guildId: string, channelId: string) {
		const ignoredChannel: IgnoredChannel = {
			guildId,
			channelId
		}
		this.mongoConnector.ignoredChannels.insert(ignoredChannel)
			.catch(reason => this.logger.logError(this.constructor.name, this.addIgnore.name, reason))
	}

	private validateChannelId(textChannel: TextChannel | NewsChannel | DMChannel, channelId: string, guildId: string | undefined): boolean {
		let isValid = true
		let message = Constants.emptyString
		if (textChannel.type === ChannelType.dm) {
			message = Messages.dmNotSupported
			isValid = false
		}
		else if (guildId === undefined) {
			message = Messages.commandProcessError + Messages.missingGuild
			isValid = false
		}
		if (isValid) {
			const guild = this.client.guilds.resolve((guildId as string).trim())
			if (!guild) {
				message = Messages.commandProcessError + Messages.missingGuild
				isValid = false
			} else {
				const channel = guild.channels.resolve(channelId)
				if (channel?.type !== ChannelType.voice) {
					message = Messages.commandProcessError + Messages.notVoiceChannelId
					isValid = false
				}
			}
		}

		if (message !== Constants.emptyString) {
			textChannel.send(message)
				.catch(reason => this.logger.logError(this.constructor.name, this.validateChannelId.name, reason))
		}
		return isValid
	}
}