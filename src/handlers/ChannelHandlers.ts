import {
	VoiceState,
	TextChannel,
	GuildMember,
	Guild,
	GuildChannelCreateOptions,
	Client,
	Permissions,
	CategoryChannel,
	PermissionResolvable,
	VoiceChannel,
	PartialDMChannel,
	Channel,
} from 'discord.js'
import { MongoConnector } from '../db/MongoConnector'
import {
	TextChannelMap,
	TextCategory
} from '../entities'
import { Logger } from '../Logger'
import {
	Permission,
	ChannelType
} from '../enums'
import { Constants } from '../descriptor'
import { TypeGuarder } from '../services'
import { Channels as AnyChannel, SafePermissionOverwriteOptions } from '../types'


export class ChannelHandlers {
	private client: Client
	private mongoConnector: MongoConnector
	private logger: Logger

	constructor(mongoConnector: MongoConnector, logger: Logger, client: Client) {
		this.mongoConnector = mongoConnector
		this.logger = logger
		this.client = client
	}

	public async handleChannelJoin(newVoiceState: VoiceState): Promise<void> {
		const channelId = newVoiceState.channelId as string
		if (channelId === newVoiceState.guild.afkChannelId) return
		const textChannelMap = await this.mongoConnector.textChannelRepository.get(newVoiceState.guild.id, channelId)
		const textChannel = this.resolve(newVoiceState, textChannelMap?.textChannelId)

		if (textChannel) return this.showHideTextChannel(textChannel, newVoiceState.member, true)

		if(textChannelMap) await this.mongoConnector.textChannelRepository.delete(newVoiceState.guild.id, channelId)
		this.createTextChannel(newVoiceState)
			.catch(reason => this.logger.logError(this.constructor.name, this.handleChannelJoin.name, reason))
	}

	public async handleChannelLeave(oldVoiceState: VoiceState): Promise<void> {
		const textChannelMap = await this.mongoConnector.textChannelRepository.get(oldVoiceState.guild.id, oldVoiceState.channelId as string)

		const textChannel = this.resolve(oldVoiceState, textChannelMap?.textChannelId)
		if (!textChannel) return
		this.showHideTextChannel(textChannel, oldVoiceState.member, false)

		if (oldVoiceState.channel && !oldVoiceState.channel?.members.size) {
			this.deleteNotPinnedMessages(textChannel, oldVoiceState.channel.id)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleChannelLeave.name, reason))
		}
	}

	public handleVoiceChannelDelete(channel: Channel | PartialDMChannel): void {
		if(!TypeGuarder.isVoiceChannel(channel)) return
		this.mongoConnector.textChannelRepository.get(channel.guild.id, channel.id)
			.then(textChannelMap => this.deleteLinkedTextChannel(channel, textChannelMap))
			.catch(reason => this.logger.logError(this.constructor.name, this.handleVoiceChannelDelete.name, reason))
	}

	private deleteLinkedTextChannel(channel: VoiceChannel, textChannelMap: TextChannelMap): void {
		if(!textChannelMap) return
		const textChannel = channel.guild.channels.cache.find(ch => ch.id === textChannelMap.textChannelId)
		if(!textChannel) return
		textChannel.delete()
			.catch(reason => this.logger.logError(this.constructor.name, this.deleteLinkedTextChannel.name, reason))
		this.mongoConnector.textChannelRepository.delete(textChannelMap.guildId, textChannelMap.voiceChannelId)
			.catch(reason => this.logger.logError(this.constructor.name, this.deleteLinkedTextChannel.name, reason))
	}

	private async createTextChannel(newVoiceState: VoiceState) {
		const guild = newVoiceState.guild
		const isIgnored = await this.checkIfIgnored(guild, newVoiceState)
		if (!newVoiceState.channelId || !guild || isIgnored || !guild.me?.permissions) return

		const parentId = await this.resolveTextCategory(guild)
		const category = guild.channels.cache.find(c => c.id === parentId) as CategoryChannel

		if (!this.sufficientPermissions([Permission.manageChannels, Permission.manageRoles],
			guild?.me?.permissions, category?.permissionsFor(guild.me?.id ))) return

		const options: GuildChannelCreateOptions = {
			type: ChannelType.guildText,
			permissionOverwrites: [
				{
					id: guild.id,
					deny: [Permission.viewChannel]
				},
				{
					id: this.client.user?.id as string,
					allow: [Permission.viewChannel]
				},
				{
					id: newVoiceState.member?.id as string,
					allow: [Permission.viewChannel]
				}
			],
		}

		if (category && category.children.size < 50) options.parent = parentId
		const voiceChannelName = newVoiceState.channel?.name ?? Constants.undefinedId // workaround before discord.js implements stage channels
		guild.channels.create(voiceChannelName + Constants.textSuffix, options)
			.then(ch => this.registerChannel(newVoiceState.channelId, ch))
			.catch(reason => this.logger.logError(this.constructor.name, this.createTextChannel.name, reason))

	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(id) as TextChannel
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if (!this.sufficientPermissionsForChannel([Permission.manageRoles, Permission.manageChannels, Permission.viewChannel], textChannel) || !user || !textChannel) return

		this.skip(user)
			.then(skip => {
				if (skip) return
				// eslint-disable-next-line @typescript-eslint/naming-convention
				const option : SafePermissionOverwriteOptions = { VIEW_CHANNEL : value }
				textChannel.permissionOverwrites.edit(user, option)
					.catch(reason => this.logger.logError(this.constructor.name, this.showHideTextChannel.name, reason, textChannel.guild.id))
			})
			.catch(reason => this.logger.logError(this.constructor.name, this.showHideTextChannel.name, reason, textChannel.guild.id))
	}

	private async deleteNotPinnedMessages(textChannel: TextChannel, voiceChannelId: string) {
		if (!this.sufficientPermissionsForChannel([Permission.manageMessages, Permission.manageChannels, Permission.viewChannel], textChannel)) return

		const textChannelMap = await this.mongoConnector.textChannelRepository.get(textChannel.guild.id, voiceChannelId)
		if (textChannelMap.preserve) return

		try {
			await this.fetchAndDelete(textChannel)
		}
		catch (error) {
			this.logger.logError(this.constructor.name, this.deleteNotPinnedMessages.name, error as string, textChannel.guild.id)
		}
	}

	private async resolveTextCategory(guild: Guild): Promise<string> {
		let textCategoryId = await this.mongoConnector.textCategoryRepository.getId(guild.id)
		const categoryExists = guild.channels.cache.find(c => c.id === textCategoryId)
		if (!categoryExists) {
			this.mongoConnector.textCategoryRepository.deleteForGuild(guild.id)
				.catch(reason => this.logger.logError(this.constructor.name, this.resolveTextCategory.name, reason))
			textCategoryId = Constants.emptyString
		}
		if (this.isNullOrEmpty(textCategoryId)) {
			textCategoryId = await this.createCategory(guild)
		}
		return textCategoryId
	}

	private async createCategory(guild: Guild): Promise<string> {
		if (!this.sufficientPermissions(Permission.manageChannels, guild.me?.permissions)) return Constants.emptyString

		let categoryId = Constants.emptyString

		await guild.channels.create(Constants.categoryName, { type: ChannelType.guildCategory })
			.then(async (category) => categoryId = await this.registerCategory(category))
			.catch(reason => { this.logger.logError(this.constructor.name, this.createCategory.name, reason) })

		return categoryId
	}

	private async registerCategory(category: CategoryChannel): Promise<string> {
		const textCategoryMap: TextCategory = {
			guildId: category.guild.id,
			textCategoryId: category.id
		}
		return this.mongoConnector.textCategoryRepository.insert(textCategoryMap)
			.then(success => {
				return success ? category.id : Constants.emptyString
			})
	}

	private registerChannel(voiceChannelId: string | undefined | null, channel: AnyChannel): void {
		if(!voiceChannelId || !TypeGuarder.isTextChannel(channel) || !channel.id) return

		const textChannelMap: TextChannelMap = {
			guildId: channel.guild.id,
			voiceChannelId,
			textChannelId: channel.id
		}
		this.mongoConnector.textChannelRepository.insert(textChannelMap)
			.catch(reason => this.logger.logError(this.constructor.name, this.registerChannel.name, reason))

	}

	private isNullOrEmpty(target: string): boolean {
		return !target || 0 === target.length
	}

	private async skip(user: GuildMember): Promise<boolean> {
		return user.permissions.has(Permission.administrator)
			|| user.user.bot
			|| await this.userSkipped(user)
			|| await this.userInSkippedRole(user)
	}

	private async userSkipped(user: GuildMember): Promise<boolean> {
		return this.mongoConnector.skippedUsers.exists(user.guild?.id, user.id)
	}

	private async userInSkippedRole(user: GuildMember): Promise<boolean> {
		const skippedRoleIds = (await this.mongoConnector.skippedRoles.getAll(user.guild.id)).map(role => { return role.roleId })
		const userRoles = user.roles.cache.map(role => { return role.id })
		return userRoles.some(role => skippedRoleIds.includes(role))
	}

	private sufficientPermissionsForChannel(required: PermissionResolvable, textChannel: TextChannel): boolean {
		const bot = textChannel.guild.me
		return this.sufficientPermissions(required,
			bot?.permissions,
			textChannel.parent?.permissionsFor(bot?.id as string))
	}

	private sufficientPermissions(required: PermissionResolvable, ...permissions: (Readonly<Permissions> | undefined | null)[]): boolean {
		return permissions.every(permissionSet => !permissionSet || permissionSet.has([Permission.viewChannel, required]))
	}

	private async fetchAndDelete(textChannel: TextChannel): Promise<boolean> {
		let anyLeft = true
		const fetched = await textChannel.messages.fetch({ limit: 100 })
		const notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned)
		anyLeft = notPinned.size > 0
		if (anyLeft) {
			await textChannel.bulkDelete(notPinned)
			return this.fetchAndDelete(textChannel)
		}

		return true
	}

	private async checkIfIgnored(guild: Guild, newVoiceState: VoiceState) {
		const channelIgnored = await this.mongoConnector.ignoredChannels.exists(guild?.id, newVoiceState.channel?.id)
		const categoryIgnored = await this.mongoConnector.ignoredChannels.exists(guild?.id, newVoiceState.channel?.parentId as string)
		return channelIgnored || categoryIgnored
	}
}
