import {
	VoiceState,
	TextChannel,
	GuildMember,
	Guild,
	GuildCreateChannelOptions,
	Client,
	Permissions,
	CategoryChannel,
	PermissionResolvable,
} from "discord.js"
import { MongoConnector } from "../db/MongoConnector"
import {
	TextChannelMap,
	TextCategory
} from "../entities"
import { Logger } from "../Logger"
import {
	Permission,
	ChannelType
} from "../enums"
import { Constants } from "../descriptor"

export class ChannelHandlers {
	private client: Client
	private mongoConnector: MongoConnector
	private logger: Logger

	constructor(mongoConnector: MongoConnector, logger: Logger, client: Client) {
		this.mongoConnector = mongoConnector
		this.logger = logger
		this.client = client
	}

	public async handleChannelJoin(newVoiceState: VoiceState) {
		let channelId = newVoiceState.channelID as string
		if (channelId === newVoiceState.guild.afkChannelID) return
		let textChannelMap = await this.mongoConnector.textChannelRepository.getTextChannelMap(newVoiceState.guild.id, channelId)
		let textChannel = this.resolve(newVoiceState, textChannelMap?.textChannelId)

		if (textChannel) {
			this.showHideTextChannel(textChannel, newVoiceState.member, true)
		}
		else {
			await this.mongoConnector.textChannelRepository.delete(newVoiceState.guild.id, channelId)
			this.createTextChannel(newVoiceState)
		}
	}

	public async handleChannelLeave(oldVoiceState: VoiceState) {
		let textChannelMap = await this.mongoConnector.textChannelRepository.getTextChannelMap(oldVoiceState.guild.id, oldVoiceState.channelID as string)

		let textChannel = this.resolve(oldVoiceState, textChannelMap?.textChannelId)
		if (!textChannel) return
		this.showHideTextChannel(textChannel, oldVoiceState.member, false)

		if (oldVoiceState.channel && !oldVoiceState.channel?.members.size) {
			this.deleteNotPinnedMessages(textChannel, oldVoiceState.channel.id)
		}
	}

	private async createTextChannel(newVoiceState: VoiceState) {
		let guild = newVoiceState.channel?.guild
		let isIgnored = await this.mongoConnector.ignoredChannels.any(guild?.id as string, newVoiceState.channel?.id as string)
		if (!newVoiceState.channel || !guild || isIgnored || !guild.me?.permissions) return

		let parentId = await this.resolveTextCategory(guild)
		let category = newVoiceState.channel?.guild.channels.cache.find(c => c.id == parentId) as CategoryChannel

		if (!this.sufficientPermissions([Permission.MANAGE_CHANNELS, Permission.MANAGE_ROLES],
			guild?.me?.permissions, category?.permissionsFor(guild.me?.id as string))) return

		let options: GuildCreateChannelOptions = {
			type: ChannelType.text,
			permissionOverwrites: [
				{
					id: guild.id,
					deny: [Permission.VIEW_CHANNEL]
				},
				{
					id: this.client.user?.id as string,
					allow: [Permission.VIEW_CHANNEL]
				},
				{
					id: newVoiceState.member?.id as string,
					allow: [Permission.VIEW_CHANNEL]
				}
			],
		}

		if (category && category.children.size < 50) options.parent = parentId
		newVoiceState.channel.guild.channels.create(newVoiceState.channel.name + Constants.TextSuffix, options)
			.then(ch => this.registerChannel(newVoiceState.channel?.id as string, ch as TextChannel))
			.catch(async reason => this.logger.logError(this.constructor.name, this.createTextChannel.name, reason))

	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(id) as TextChannel
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if (!this.sufficientPermissionsForChannel(Permission.MANAGE_ROLES, textChannel) || !user || !textChannel) return

		this.skip(user)
			.then(skip => {
				if (skip) return
				textChannel.updateOverwrite(user, { VIEW_CHANNEL: value })
					.catch(reason => this.logger.logError(this.constructor.name, this.showHideTextChannel.name, reason))
			})
	}

	private async deleteNotPinnedMessages(textChannel: TextChannel, voiceChannelId: string) {
		if (!this.sufficientPermissionsForChannel(Permission.MANAGE_MESSAGES, textChannel)) return

		let textChannelMap = await this.mongoConnector.textChannelRepository.getTextChannelMap(textChannel.guild.id, voiceChannelId)
		if (textChannelMap.preserve) return

		try {
			await this.fetchAndDelete(textChannel)
		}
		catch (error) {
			this.logger.logError(this.constructor.name, this.deleteNotPinnedMessages.name, error)
		}
	}

	private async resolveTextCategory(guild: Guild): Promise<string> {
		let textCategoryId = await this.mongoConnector.textCategoryRepository.getId(guild.id)
		let categoryExists = guild.channels.cache.find(c => c.id == textCategoryId)
		if (!categoryExists) {
			this.mongoConnector.textCategoryRepository.deleteForGuild(guild.id)
			textCategoryId = Constants.EmptyString
		}
		if (this.isNullOrEmpty(textCategoryId)) {
			textCategoryId = await this.createCategory(guild)
		}
		return textCategoryId
	}

	private async createCategory(guild: Guild): Promise<string> {
		if (!this.sufficientPermissions(Permission.MANAGE_CHANNELS, guild.me?.permissions)) return Constants.EmptyString

		let categoryId = Constants.EmptyString

		await guild.channels.create(Constants.CategoryName, { type: ChannelType.category })
			.then(async (category) => categoryId = await this.registerCategory(category))
			.catch(reason => { this.logger.logError(this.constructor.name, this.createCategory.name, reason) })

		return categoryId
	}

	private async registerCategory(category: CategoryChannel): Promise<string> {
		this.logger.logEvent
		let textCategoryMap: TextCategory = {
			guildId: category.guild.id,
			textCategoryId: category.id
		}
		return this.mongoConnector.textCategoryRepository.insert(textCategoryMap)
			.then(success => {
				return success ? category.id : Constants.EmptyString
			})
	}

	private async registerChannel(voiceChannelId: string, channel: TextChannel) {
		let textChannelMap: TextChannelMap = {
			guildId: channel.guild.id,
			voiceChannelId: voiceChannelId,
			textChannelId: channel.id
		}
		this.mongoConnector.textChannelRepository.insert(textChannelMap)

	}

	private isNullOrEmpty(target: string): boolean {
		return !target || 0 === target.length
	}

	private async skip(user: GuildMember): Promise<boolean> {
		return user.hasPermission(Permission.ADMINISTRATOR)
			|| user.user.bot
			|| await this.userSkipped(user)
			|| await this.userInSkippedRole(user)
	}

	private async userSkipped(user: GuildMember): Promise<boolean> {
		return this.mongoConnector.skippedUsers.any(user.guild?.id, user.id)
	}

	private async userInSkippedRole(user: GuildMember): Promise<boolean> {
		let skippedRoleIds = (await this.mongoConnector.skippedRoles.getAll(user.guild.id)).map(role => { return role.roleId })
		let userRoles = user.roles.cache.map(role => { return role.id })
		return userRoles.some(role => skippedRoleIds.includes(role))
	}

	private sufficientPermissionsForChannel(required: PermissionResolvable, textChannel: TextChannel): boolean {
		let bot = textChannel.guild.me
		return this.sufficientPermissions(required,
			bot?.permissions,
			textChannel.parent?.permissionsFor(bot?.id as string))
	}

	private sufficientPermissions(required: PermissionResolvable, ...permissions: (Readonly<Permissions> | undefined | null)[]): boolean {
		for (let permissionSet of permissions) {
			if (permissionSet && !permissionSet.has([Permission.VIEW_CHANNEL, required])) return false
		}
		return true
	}

	private async fetchAndDelete(textChannel: TextChannel): Promise<boolean> {
		let anyLeft = true
		let fetched = await textChannel.messages.fetch({ limit: 100 })
		let notPinned = fetched.filter(fetchedMsg => !fetchedMsg.pinned)
		anyLeft = notPinned.size > 0
		if (anyLeft) {
			await textChannel.bulkDelete(notPinned)
			return this.fetchAndDelete(textChannel)
		}

		return true
	}
}