import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../Config'
import { MongoConnector } from '../../db'
import { Messages } from '../../descriptor'
import { TextChannelMap } from '../../entities'
import { BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { TypeGuarder,
	ChannelIdValidator
} from '../../services'
import { BaseHandler } from './BaseHandler'
import { IHandler } from './IHandler'

@IHandler.register
export class MapChannels extends BaseHandler {
	private channelIdValidator: ChannelIdValidator

	private readonly forceOption = 'force'
	private readonly tcOption = 'textchannel'
	private readonly vcOption = 'voicechannel'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.map)

		this.channelIdValidator = new ChannelIdValidator(logger, client)
		this.slash
			.setDescription('Map the Voice Channel and the Text Channel together.')
			.addChannelOption(o => o.setName(this.vcOption).setDescription('Voice Channel to map').setRequired(true))
			.addChannelOption(o => o.setName(this.tcOption).setDescription('Text Channel to map').setRequired(true))
			.addBooleanOption(o => o.setName(this.forceOption).setDescription('Force?'))
	}

	public process(interaction: CommandInteraction): void {
		const force = interaction.options.getBoolean(this.forceOption) ?? false
		const voice = interaction.options.getChannel(this.vcOption, true)
		const text = interaction.options.getChannel(this.tcOption, true)

		if(!TypeGuarder.isGuildChannel(voice) || !TypeGuarder.isGuildChannel(text)) return

		void this.linkChannels(interaction, voice.guild.id, force, voice.id, text.id)
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
			.then(() => super.process(interaction))
	}

	private async linkChannels(interaction: CommandInteraction, guildId: string, override: boolean, voiceChannelId: string, textChannelId: string) {
		try {
			await this.validateAndApply(interaction, voiceChannelId, guildId, textChannelId, override)
		}
		catch (e) {
			this.handleLinkingError(e, voiceChannelId, textChannelId, interaction)
		}
	}

	private handleLinkingError(e: any, voiceChannelId: string, textChannelId: string, interaction: CommandInteraction) {
		let err = e instanceof Error ? e.message : e as string
		if (!err) err = Messages.unknownLinkError
		this.logger.logError(this.constructor.name, this.linkChannels.name, err, voiceChannelId, textChannelId)
		interaction.reply({ content: err, ephemeral: true })
			.catch(reason => this.logger.logError(this.constructor.name, this.linkChannels.name, reason))
	}

	private async validateAndApply(interaction: CommandInteraction, voiceChannelId: string, guildId: string, textChannelId: string, override: boolean) {

		this.channelIdValidator.validate(voiceChannelId, guildId)

		const textChannel = interaction.guild?.channels.resolve(textChannelId)
		if (!textChannel || !TypeGuarder.isTextChannel(textChannel))
			throw new Error(Messages.invalidTextChannelId)

		// gather existing mapings before they are mutated
		const voiceMap = await this.mongoConnector.textChannelRepository.get(guildId, voiceChannelId)
		const textMap = await this.mongoConnector.textChannelRepository.getByTextChannelId(guildId, textChannelId)

		// adjust mapings to fit new one
		const voiceHandled = this.handleVoiceMap(interaction, voiceMap, override, textChannelId)
		const textHandled = this.handleTextMap(interaction, textMap, override, voiceChannelId)

		// if none of the maping were adjusted - then new one should be created
		if (!voiceHandled && !textHandled)
			this.insertNewMap(interaction, guildId, voiceChannelId, textChannelId)
	}

	private handleVoiceMap(interaction: CommandInteraction, textChannelMap: TextChannelMap, override: boolean, textChannelId: string): boolean {
		if(!textChannelMap) return false

		if(!override) throw new Error(Messages.voiceChannelMapped)
		this.mongoConnector.textChannelRepository.changeTextChannelId(textChannelMap, textChannelId)
			.catch(reason => { throw new Error(reason) })
		interaction.reply({ content: Messages.voiceMapEditNotice(textChannelId), ephemeral: true })
			.catch(reason => { throw new Error(reason) })

		return true
	}

	private handleTextMap(interaction: CommandInteraction, textChannelMap: TextChannelMap, override: boolean, voiceChannelId: string): boolean {
		if(!textChannelMap) return false

		if(!override) throw new Error(Messages.textChannelMapped)
		this.mongoConnector.textChannelRepository.delete(textChannelMap.guildId, textChannelMap.voiceChannelId)
			.catch(reason => { throw new Error(reason) })
		interaction.reply({ content: Messages.textMapDeleteNotice(voiceChannelId), ephemeral: true })
			.catch(reason => { throw new Error(reason) })

		this.insertNewMap(interaction, textChannelMap.guildId, voiceChannelId, textChannelMap.textChannelId)

		return true
	}

	private insertNewMap(interaction: CommandInteraction, guildId: string, voiceChannelId: string, textChannelId: string): void {
		const textCategoryMap: TextChannelMap = {
			guildId,
			voiceChannelId,
			textChannelId,
			preserve: false
		}
		this.mongoConnector.textChannelRepository.insert(textCategoryMap)
			.catch(reason => { throw new Error(reason) })

		interaction.reply({ content: Messages.textMapCreateNotice(voiceChannelId), ephemeral: true })
			.catch(reason => { throw new Error(reason) })
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.permissions.has(Permission.manageChannels, true))
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
            *Danger zone! High risk to shoot your own leg. Use at your own discretion*
            Map the Voice Channel and the Text Channel together.
            
            If not forced, the bot will post a warning in case:
                - \`${this.vcOption}\` or \`${this.tcOption}\` are invalid (no matching channel found);
                - The Voice Channel already has a Text Channel mapped to it;
                - The Text Channel has already been mapped to a Voice Channel;

            If forced, the bot will override existing mapping, but will also post warnings for each mapping that had to be deleted/edited.

            Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}