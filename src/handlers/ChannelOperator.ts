import { Client, VoiceState, TextChannel, GuildMember, Guild, CategoryChannel } from "discord.js";
import { Dictionary } from "../collections/Dictionary";
import { Logger } from "./Logger";
import { ChannelType } from "../enums/ChannelType"
import { EnvType } from "../enums/EnvType";

export class ChannelOperator {
	private client: Client
	private config: any
	private logger: Logger
	private channelMap: Dictionary<string>
	private guildCategories: Dictionary<string>

	constructor(client: Client, config: any) {
		this.client = client
		this.config = config
		this.logger = new Logger()
		this.channelMap = new Dictionary<string>()
		this.guildCategories = new Dictionary<string>()
	}

	public async createCategory(guild: Guild): Promise<CategoryChannel> {
		let channelCreationPromise = guild.channels.create(this.config.settings.categoryName, {
			type: ChannelType.category
		})

		channelCreationPromise
			.then((category) => {
				this.logger.logEvent
				this.guildCategories.Add(guild.id, category.id)
			})
			.catch(this.logger.logError)

		return channelCreationPromise
	}

	public handleChannelJoin(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let channelID = newVoiceState.channelID as string

		if (this.channelMap.ContainsKey(channelID)) {
			let textChannel = this.resolve(newVoiceState, channelID) as TextChannel
			this.showHideTextChannel(textChannel, user, true)
			textChannel.send(`!${newVoiceState.channel?.name}`)

			if (process.env.NODE_ENV === EnvType.Debug) textChannel?.send(`${this.resolveUsername(user)} joined channel ${textChannel.name}`) // test purposes only
		}
		else {
			this.initTextChannel(newVoiceState)
		}
	}

	public handleChannelLeave(oldVoiceState: VoiceState) {
		let user = oldVoiceState.member
		let channelID = oldVoiceState.channelID as string

		if (this.channelMap.ContainsKey(channelID)) {
			let textChannel = this.resolve(oldVoiceState, channelID)
			this.showHideTextChannel(textChannel, user, false)
			
			if (process.env.NODE_ENV === EnvType.Debug) textChannel.send(`${this.resolveUsername(user)} has left channel ${textChannel.name}`) // test purposes only

			let voiceChannel = oldVoiceState.channel
			if(voiceChannel?.members.size !== undefined && voiceChannel?.members.size <= 0) {
				textChannel.delete()
				.then(ch => {
					this.channelMap.Remove(channelID)
				})
			}
		}
	}

	private initTextChannel(newVoiceState: VoiceState) {
		if (!this.guildCategories.ContainsKey(newVoiceState.guild.id)) {
			this.createCategory(newVoiceState.guild)
				.then(() => this.createTextChannel(newVoiceState))
				.catch(this.logger.logError)
		}
		else {
			this.createTextChannel(newVoiceState)
		}
	}

	private createTextChannel(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let channelName = newVoiceState.channel?.name
		let channelID = newVoiceState.channelID as string

		newVoiceState.channel?.guild.channels.create(channelName + '-text', {
			type: ChannelType.text,
			parent: this.guildCategories.Item(newVoiceState.guild.id)
		})
			.then(ch => {
				this.showHideTextChannel(ch, user, true)
				this.channelMap.Add(channelID, ch.id)
				
				if (process.env.NODE_ENV === EnvType.Debug) ch.send(`channel created for ${this.resolveUsername(user)}`); // test purposes only
			});
	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(this.channelMap.Item(id)) as TextChannel
	}

	private resolveUsername(user: GuildMember | null): string {
		return (user?.nickname !== undefined ? user?.nickname : user?.displayName) as string
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if (user != null) textChannel.updateOverwrite(user, { VIEW_CHANNEL: value })
	}
}