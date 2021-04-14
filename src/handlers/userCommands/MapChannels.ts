import { Client, Message } from 'discord.js'
import { MongoConnector } from '../../db'
import { Constants, Messages } from '../../descriptor'
import { TextChannelMap } from '../../entities'
import { BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { ChannelIdValidator } from '../../services/ChannelIdValidator'
import { BaseHandler } from './BaseHandler'

export class MapChannels extends BaseHandler {
	private channelIdValidator: ChannelIdValidator
	private mongoConnector: MongoConnector

	constructor(logger: Logger, client: Client, mongoConnector: MongoConnector, prefix: string) {
		super(logger, prefix + BotCommand.map)

		this.channelIdValidator = new ChannelIdValidator(logger, client)
		this.mongoConnector = mongoConnector
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const guildId = message.guild?.id as string

		this.linkChannels(message, guildId, args[0] === '1', args[1], args[2])
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	private async linkChannels(message: Message, guildId: string, override: boolean, voiceChannelId: string, textChannelId: string) {
		try {
			const isValid = this.channelIdValidator.validate(message.channel, voiceChannelId, guildId)
			if (!isValid) throw new Error(Messages.invalidChannelId)

			// gather existing mapings before they are mutated
			const voiceMap = await this.mongoConnector.textChannelRepository.get(guildId, voiceChannelId)
			const textMap = await this.mongoConnector.textChannelRepository.getByTextChannelId(guildId, textChannelId)

			// adjust mapings to fit new one
			const voiceHandled = this.handleVoiceMap(message, voiceMap, override, textChannelId)
			const textHandled = this.handleTextMap(message, textMap, override, voiceChannelId)

			// if none of the maping were adjusted - then new one should be created
			if(!voiceHandled && !textHandled) this.insertNewMap(message, guildId, voiceChannelId, textChannelId)
		}
		catch (e) {
			let err = e instanceof Error ? e.message : e as string
			if(!err) err = 'Unknown error. Please raise a ticket at ' + Constants.repoUrl + Constants.issuesUri
			this.logger.logError(this.constructor.name, this.linkChannels.name, err, voiceChannelId, textChannelId)
			message.channel.send(err)
				.catch(reason => this.logger.logError(this.constructor.name, this.linkChannels.name, reason))
		}
	}

	private handleVoiceMap(message: Message, textChannelMap: TextChannelMap, override: boolean, textChannelId: string): boolean {
		if(!textChannelMap) return false

		if(!override) throw new Error(Messages.voiceChannelMapped)
		this.mongoConnector.textChannelRepository.changeTextChannelId(textChannelMap, textChannelId)
			.catch(reason => { throw new Error(reason) })
		message.channel.send(Messages.voiceMapEditNotice + textChannelId)
			.catch(reason => { throw new Error(reason) })

		return true
	}

	private handleTextMap(message: Message, textChannelMap: TextChannelMap, override: boolean, voiceChannelId: string): boolean {
		if(!textChannelMap) return false

		if(!override) throw new Error(Messages.textChannelMapped)
		this.mongoConnector.textChannelRepository.delete(textChannelMap.guildId, textChannelMap.voiceChannelId)
			.catch(reason => { throw new Error(reason) })
		message.channel.send(Messages.textMapDeleteNotice + voiceChannelId)
			.catch(reason => { throw new Error(reason) })

		this.insertNewMap(message, textChannelMap.guildId, voiceChannelId, textChannelMap.textChannelId)

		return true
	}

	private insertNewMap(message: Message, guildId: string, voiceChannelId: string, textChannelId: string): void {
		const textCategoryMap: TextChannelMap = {
			guildId,
			voiceChannelId,
			textChannelId,
			preserve: false
		}
		this.mongoConnector.textChannelRepository.insert(textCategoryMap)
			.catch(reason => { throw new Error(reason) })

		message.channel.send(Messages.textMapCreateNotice + voiceChannelId)
			.catch(reason => { throw new Error(reason) })
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.hasPermission(Permission.manageChannels, { checkAdmin: true, checkOwner: true}))
	}
}