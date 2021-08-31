import { Client,
	CommandInteraction,
	Message,
	MessageEmbed
} from 'discord.js'
import { IHandler } from './IHandler'
import { Config } from '../../Config'
import { MongoConnector } from '../../db/MongoConnector'
import { Constants } from '../../descriptor'
import { TextChannelMap } from '../../entities'
import {
	BotCommand,
	Permission
} from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'
import { TypeGuarder } from '../../services'

@IHandler.register
export class Preserve extends BaseHandler {

	private readonly flagOption = 'enable'
	private readonly idOption = 'voicechannel'

	constructor(client: Client, logger: Logger, config: Config, mongoConnector: MongoConnector) {
		super(client, logger, config, mongoConnector, BotCommand.preserve)

		this.slash
			.setDescription('Enable/disable clearance of the Text Channel after the last User has left associated Voice Channel.')
			.addBooleanOption(o =>
				o
					.setName(this.flagOption)
					.setDescription('Enable clearance?')
					.setRequired(true)
			)
			.addChannelOption(o => o.setName(this.idOption).setDescription('Voice Channel, for which it should be changed').setRequired(true))
	}

	public process(interaction: CommandInteraction): void {
		const flag = interaction.options.getBoolean(this.flagOption, true)
		const mentioned = interaction.options.getChannel(this.idOption, true)

		if(TypeGuarder.isGuildChannel(mentioned))
			this.handlePreserveCall(mentioned.guild.id, flag, mentioned.id)

		super.process(interaction)
	}

	private handlePreserveCall(guildId: string, preserve: boolean, voiceChannelId: string): void {

		const textChannelMap: TextChannelMap = {
			guildId,
			voiceChannelId,
			textChannelId: Constants.emptyString
		}
		this.mongoConnector.textChannelRepository.setPreserveOption(textChannelMap, preserve)
			.catch(reason => this.logger.logError(this.constructor.name, this.handlePreserveCall.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.permissions.has(Permission.manageChannels, true))
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd}`, `
			Enable/disable clearance of the Text Channel after the last User has left associated Voice Channel.
            The pinned messages will remain in all Nexus-handled Text Channels with both options.
			Supports arguments chaining - you're allowed to use more than 1 Voice Channel ID.
			Note: You need to use Voice Channel ID, not mapped Text Channel ID.
            
            Requires user to have admin/owner rights or permissions to manage channels and roles.
		`)
	}
}