import { VoiceState, TextChannel, GuildMember, Collection, Message, Guild, CategoryChannel, GuildCreateChannelOptions, Client } from "discord.js";
import { ChannelType } from "../enums/ChannelType"
import { MongoConnector } from "../db/MongoConnector";
import { TextChannelMap } from "../entities/TextChannelMap";
import { Config } from "../config";
import { Logger } from "./Logger";
import { TextCategoryMap } from "../entities/TextCategoryMap";
import { Permission } from "../enums/Permission";

export class ChannelOperator {
    private client: Client
	private mongoConnector: MongoConnector
	private config: Config
	private logger: Logger

	constructor(mongoConnector: MongoConnector, config: Config, logger: Logger, client: Client) {
		this.mongoConnector = mongoConnector
		this.config = config
		this.logger = logger
		this.client = client
	}

	public async handleChannelJoin(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let guildId = newVoiceState.guild.id
		let channelId = newVoiceState.channelID as string
		if (channelId === newVoiceState.guild.afkChannelID) return
		let textChannelId = await this.mongoConnector.textChannelRepository.getId(guildId, channelId)
		let textChannel = this.resolve(newVoiceState, textChannelId)

		if (textChannel) {
			this.showHideTextChannel(textChannel, user, true)
		}
		else {
			if (!this.isNullOrEmpty(textChannelId)) await this.mongoConnector.textChannelRepository.delete(guildId, channelId)
			this.createTextChannel(newVoiceState)
		}
	}

	public async handleChannelLeave(oldVoiceState: VoiceState) {
		let user = oldVoiceState.member
		let guildId = oldVoiceState.guild.id
		let channelID = oldVoiceState.channelID as string
		let textChannelId = await this.mongoConnector.textChannelRepository.getId(guildId, channelID)

		if (!this.isNullOrEmpty(textChannelId)) {
			let textChannel = this.resolve(oldVoiceState, textChannelId)
			if (!textChannel) return
			this.showHideTextChannel(textChannel, user, false)

			let voiceChannel = oldVoiceState.channel
			if (!voiceChannel?.members.size) {
				this.deleteNotPinnedMessages(textChannel)
			}
		}
	}

	private async createTextChannel(newVoiceState: VoiceState) {
		let guild = newVoiceState.channel?.guild	

		if (guild && guild.me?.permissions.has(Permission.MANAGE_CHANNELS) && guild.me?.permissions.has(Permission.MANAGE_ROLES)) {
			let user = newVoiceState.member
			let voiceChannel = newVoiceState.channel
			let channelId = newVoiceState.channelID as string	
			let parentId = await this.resolveTextCategory(guild)
			let options: GuildCreateChannelOptions = {
				permissionOverwrites: [{ id: guild.id, deny: [Permission.VIEW_CHANNEL] }, {id: this.client.user ? this.client.user.id : "", allow: [Permission.VIEW_CHANNEL] }],
				type: ChannelType.text,
			}
			if (parentId) options.parent = parentId as string
			if (voiceChannel) {
				newVoiceState.channel?.guild.channels.create(voiceChannel.name + '-text', options)
					.then(ch => {
						ch.overwritePermissions([
							{
								id: user ? user.id : "undefined",
								allow: [Permission.VIEW_CHANNEL],
							},
						]);
						let textChannelMap: TextChannelMap = { guildId: ch.guild.id, voiceChannelId: channelId, textChannelId: ch.id }
						this.mongoConnector.textChannelRepository.add(textChannelMap)
					});
			}
		}
	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(id) as TextChannel
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if(!textChannel.guild.me?.permissions.has(Permission.MANAGE_CHANNELS)) return

		if (user && textChannel) {
			if (user.hasPermission(Permission.ADMINISTRATOR) || user.user.bot) return
			textChannel.updateOverwrite(user, { VIEW_CHANNEL: value })
		}
	}

	private async deleteNotPinnedMessages(textChannel: TextChannel) {
		if(!textChannel.guild.me?.permissions.has(Permission.MANAGE_MESSAGES)) return

		let fetched: Collection<string, Message>;
		let notPinned: Collection<string, Message>;
		do {
			fetched = await textChannel.messages.fetch({ limit: 100 });
			notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned);
			if (notPinned.size > 0) await textChannel.bulkDelete(notPinned);
		}
		while (notPinned.size > 0)
	}

	private async resolveTextCategory(guild: Guild): Promise<string> {
		let textCategoryId = await this.mongoConnector.textCategoryRepository.getId(guild.id)
		if (this.isNullOrEmpty(textCategoryId)) {
			textCategoryId = await this.createCategory(guild)
		}
		return textCategoryId
	}

	private async createCategory(guild: Guild): Promise<string> {
		if(!guild.me?.permissions.has(Permission.MANAGE_CHANNELS)) return ''

		let channelCreationPromise = guild.channels.create(this.config.categoryName, {
			type: ChannelType.category
		})

		return channelCreationPromise
			.then((category) => {
				this.logger.logEvent
				let textCategoryMap: TextCategoryMap = { guildId: category.guild.id, textCategoryId: category.id }
				return this.mongoConnector.textCategoryRepository.add(textCategoryMap)
			})
	}

	private isNullOrEmpty(target: string): boolean {
		return (!target || 0 === target.length)
	}
}