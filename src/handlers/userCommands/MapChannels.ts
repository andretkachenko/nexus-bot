import { Client,
	Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../config'
import { MongoConnector } from '../../db'
import { Constants,
	Messages
} from '../../descriptor'
import { TextChannelMap } from '../../entities'
import { BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { TypeGuarder } from '../../services'
import { ChannelIdValidator } from '../../services/ChannelIdValidator'
import { BaseHandler } from './BaseHandler'

export class MapChannels extends BaseHandler {
	private channelIdValidator: ChannelIdValidator
	private mongoConnector: MongoConnector

	constructor(logger: Logger, client: Client, mongoConnector: MongoConnector, config: Config) {
		super(logger, config, BotCommand.map)

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
			const validVoiceId = this.channelIdValidator.validate(message.channel, voiceChannelId, guildId)
			if (!validVoiceId) throw new Error(Messages.invalidVoiceChannelId)

			const textChannel = message.guild?.channels.resolve(textChannelId)
			if(!textChannel || !TypeGuarder.isTextChannel(textChannel)) throw new Error(Messages.invalidTextChannelId)

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

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.prefix}map [0/1] {voiceChannelId} {textChannelId}`, `
            *Danger zone! High risk to shoot your own leg. Use at your own discretion*
            Map the Voice Channel and the Text Channel together.
            1 means to override existing mappings, 0 - throw error in case mappings already exist.
            1 is a 'force' option, which will override every clashing mapping
            
            If not forced, the bot will post a warning in case:
                - **voiceChannelId** or **textChannelId** are invalid (no matching channel found);
                - The Voice Channel already has a Text Channel mapped to it;
                - The Text Channel has already been mapped to a Voice Channel;

            If forced, the bot will override existing mapping, but will also post warnings for each mapping that had to be deleted/edited.

            Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}