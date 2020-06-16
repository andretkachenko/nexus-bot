import { VoiceState, TextChannel, GuildMember, Collection, Message, VoiceChannel, Guild, CategoryChannel } from "discord.js";
import { ChannelType } from "../enums/ChannelType"
import { MongoConnector } from "../db/MongoConnector";
import { TextChannelMap } from "../entities/TextChannelMap";
import { Config } from "../config";
import { Logger } from "./Logger";
import { TextCategoryMap } from "../entities/TextCategoryMap";

export class ChannelOperator {
	private mongoConnector: MongoConnector
	private config: Config
	private logger: Logger

	constructor(mongoConnector: MongoConnector, config: Config, logger: Logger) {
		this.mongoConnector = mongoConnector
		this.config = config
		this.logger = logger
	}

	public async handleChannelJoin(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let guildId = newVoiceState.guild.id
		let channelId = newVoiceState.channelID as string
		if(channelId === newVoiceState.guild.afkChannelID) return
		let textChannelId = await this.mongoConnector.textChannelRepository.getId(guildId, channelId)
		let textChannel = this.resolve(newVoiceState, textChannelId)

		if (textChannel !== null) {
			this.showHideTextChannel(textChannel, user, true)
		}
		else {
			if (textChannelId !== null && textChannelId !== undefined && textChannelId !== '') await this.mongoConnector.textChannelRepository.delete(guildId, channelId)
			this.createTextChannel(newVoiceState)
		}
	}

	public async handleChannelLeave(oldVoiceState: VoiceState) {
		let user = oldVoiceState.member
		let guildId = oldVoiceState.guild.id
		let channelID = oldVoiceState.channelID as string
		let textChannelId = await this.mongoConnector.textChannelRepository.getId(guildId, channelID)

		if (textChannelId !== undefined) {
			let textChannel = this.resolve(oldVoiceState, textChannelId)
			if (textChannel === undefined || textChannel === null) return
			this.showHideTextChannel(textChannel, user, false)

			let voiceChannel = oldVoiceState.channel
			if (voiceChannel?.members.size !== undefined && voiceChannel?.members.size <= 0) {
				this.deleteNotPinnedMessages(textChannel)
			}
		}
	}

	private async createTextChannel(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let voiceChannel = newVoiceState.channel
		let guild = newVoiceState.channel?.guild
		let channelId = newVoiceState.channelID as string
		if (guild !== null && guild !== undefined) {
			let parentId = await this.resolveTextCategory(guild)

			if (voiceChannel !== null) newVoiceState.channel?.guild.channels.create(voiceChannel.name + '-text', {
				permissionOverwrites: [{ id: guild.id, deny: ['VIEW_CHANNEL'] }],
				type: ChannelType.text,
				parent: parentId as string,
				position: voiceChannel.position + 1
			})
				.then(ch => {
					ch.overwritePermissions([
						{
							id: user !== null ? user.id : "undefined",
							allow: ['VIEW_CHANNEL'],
						},
					]);
					let textChannelMap: TextChannelMap = { guildId: ch.guild.id, voiceChannelId: channelId, textChannelId: ch.id }
					this.mongoConnector.textChannelRepository.add(textChannelMap)
				});
		}
	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(id) as TextChannel
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if (user !== null && textChannel !== null) textChannel.updateOverwrite(user, { VIEW_CHANNEL: value })
	}

	private async deleteNotPinnedMessages(textChannel: TextChannel) {
		let fetched: Collection<string, Message>;
		let notPinned: Collection<string, Message>;
		do {
			fetched = await textChannel.messages.fetch({ limit: 100 });
			notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned);
			if(notPinned.size > 0) await textChannel.bulkDelete(notPinned);
		}
		while (notPinned.size > 0)
	}

	private async resolveTextCategory(guild: Guild): Promise<string> {
		let textCategoryId = await this.mongoConnector.textCategoryRepository.getId(guild.id)
		if (textCategoryId === undefined || textCategoryId === null) {
			await this.createCategory(guild)
			textCategoryId = await this.mongoConnector.textCategoryRepository.getId(guild.id)
		}
		return textCategoryId
	}

	private async createCategory(guild: Guild): Promise<CategoryChannel> {
		let channelCreationPromise = guild.channels.create(this.config.categoryName, {
			type: ChannelType.category
		})

		channelCreationPromise
			.then((category) => {
				this.logger.logEvent
				let textCategoryMap: TextCategoryMap = { guildId: category.guild.id, textCategoryId: category.id }
				this.mongoConnector.textCategoryRepository.add(textCategoryMap)
			})
			.catch(this.logger.logError)

		return channelCreationPromise
	}
}