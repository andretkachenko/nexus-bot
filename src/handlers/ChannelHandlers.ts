import { VoiceState, TextChannel, GuildMember, Collection, Message, Guild, CategoryChannel, GuildCreateChannelOptions, Client } from "discord.js";
import { ChannelType } from "../enums/ChannelType"
import { MongoConnector } from "../db/MongoConnector";
import { TextChannelMap } from "../entities/TextChannelMap";
import { Config } from "../config";
import { Logger } from "./Logger";
import { TextCategoryMap } from "../entities/TextCategoryMap";
import { Permission } from "../enums/Permission";

export class ChannelHandlers {
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
		let textChannelMap = await this.mongoConnector.textChannelRepository.getTextChannelMap(guildId, channelId)
		let textChannelId = textChannelMap != null ? textChannelMap.textChannelId : ''
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
		let channelId = oldVoiceState.channelID as string
		let textChannelMap = await this.mongoConnector.textChannelRepository.getTextChannelMap(guildId, channelId)
		let textChannelId = textChannelMap != null ? textChannelMap.textChannelId : ''

		if (!this.isNullOrEmpty(textChannelId)) {
			let textChannel = this.resolve(oldVoiceState, textChannelId)
			if (!textChannel) return
			this.showHideTextChannel(textChannel, user, false)

			let voiceChannel = oldVoiceState.channel
			if (!voiceChannel?.members.size && voiceChannel != null) {
				this.deleteNotPinnedMessages(textChannel, voiceChannel.id)
			}
		}
	}

	private async createTextChannel(newVoiceState: VoiceState) {
		let guild = newVoiceState.channel?.guild
		let voiceChannel = newVoiceState.channel
		if (!voiceChannel) return
		let isIgnored = await this.mongoConnector.ignoredChannels.isIgnored(guild?.id as string, voiceChannel.id)
		if (isIgnored) return;

		if (guild && guild.me?.permissions.has(Permission.MANAGE_CHANNELS) && guild.me?.permissions.has(Permission.MANAGE_ROLES)) {
			let user = newVoiceState.member
			let channelId = newVoiceState.channelID as string
			let parentId = await this.resolveTextCategory(guild)
			let categoryExists = newVoiceState.channel?.guild.channels.cache.find(c => c.id == parentId)
			let options: GuildCreateChannelOptions = {
				permissionOverwrites: [
					{ id: guild.id, deny: [Permission.VIEW_CHANNEL] },
					{ id: this.client.user ? this.client.user.id : "", allow: [Permission.VIEW_CHANNEL] },
					{ id: user ? user.id : "undefined", allow: [Permission.VIEW_CHANNEL] }
				],
				type: ChannelType.text,
			}
			if (parentId && categoryExists) options.parent = parentId as string
			newVoiceState.channel?.guild.channels.create(voiceChannel.name + '-text', options)
				.then(ch => {
					let textChannelMap: TextChannelMap = { guildId: ch.guild.id, voiceChannelId: channelId, textChannelId: ch.id }
					this.mongoConnector.textChannelRepository.add(textChannelMap)
				})
				.catch(reason => {
					console.log("[ERROR] ChannelHandlers.createTextChannel() - " + reason)
				})
		}
	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(id) as TextChannel
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if (!textChannel.guild.me?.permissions.has(Permission.MANAGE_CHANNELS)) return

		if (user && textChannel) {
			if (user.hasPermission(Permission.ADMINISTRATOR) || user.user.bot) return
			textChannel.updateOverwrite(user, { VIEW_CHANNEL: value })			
				.catch(reason => {
				console.log("[ERROR] ChannelHandlers.showHideTextChannel() - " + reason)
			})
		}
	}

	private async deleteNotPinnedMessages(textChannel: TextChannel, voiceChannelId: string) {
		if (!textChannel.guild.me?.permissions.has(Permission.MANAGE_MESSAGES)) return

		let textChannelMap = await this.mongoConnector.textChannelRepository.getTextChannelMap(textChannel.guild.id, voiceChannelId)
		if(textChannelMap == null || textChannelMap.preserve == true) return

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
		let categoryExists = guild.channels.cache.find(c => c.id == textCategoryId)
		if (!categoryExists) {
			this.mongoConnector.textCategoryRepository.delete(guild.id)
			textCategoryId = ''
		}
		if (this.isNullOrEmpty(textCategoryId)) {
			textCategoryId = await this.createCategory(guild)
		}
		return textCategoryId
	}

	private async createCategory(guild: Guild): Promise<string> {
		if (!guild.me?.permissions.has(Permission.MANAGE_CHANNELS)) return ''

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