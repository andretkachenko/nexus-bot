import { VoiceState, TextChannel, GuildMember, Collection, Message, VoiceChannel } from "discord.js";
import { Dictionary } from "../collections/Dictionary";
import { ChannelType } from "../enums/ChannelType"
import { EnvType } from "../enums/EnvType";
import { IntroMap } from "../entities/IntroMap";
import { MongoConnector } from "../db/MongoConnector";
import { TextChannelMap } from "../entities/TextChannelMap";

export class ChannelOperator {
	private mongoConnector: MongoConnector

	private readonly onDebug = process.env.NODE_ENV === EnvType.Debug;

	constructor(mongoConnector: MongoConnector) {
		this.mongoConnector = mongoConnector
	}

	public async handleChannelJoin(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let guildId = newVoiceState.guild.id
		let channelId = newVoiceState.channelID as string
		let textChannelId = await this.mongoConnector.fetchTextChannelId(guildId, channelId)
		let textChannel = this.resolve(newVoiceState, textChannelId)

		if( textChannel !== null) {
			this.showHideTextChannel(textChannel, user, true)
			if (this.onDebug) textChannel?.send(`${this.resolveUsername(user)} joined channel ${textChannel.name}`) // test purposes only
		}
		else {
			this.createTextChannel(newVoiceState)
		}
	}

	public async handleChannelLeave(oldVoiceState: VoiceState) {
		let user = oldVoiceState.member
		let guildId = oldVoiceState.guild.id
		let channelID = oldVoiceState.channelID as string
		let textChannelId = await this.mongoConnector.fetchTextChannelId(guildId, channelID)

		if (textChannelId !== undefined) {
			let textChannel = this.resolve(oldVoiceState, textChannelId)
			this.showHideTextChannel(textChannel, user, false)

			if (this.onDebug)  textChannel.send(`${this.resolveUsername(user)} has left channel ${textChannel.name}`) // test purposes only

			let voiceChannel = oldVoiceState.channel
			if (voiceChannel?.members.size !== undefined && voiceChannel?.members.size <= 0) {
				this.clearTextChannel(textChannel, voiceChannel)
			}
		}
	}

	private createTextChannel(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let voiceChannel = newVoiceState.channel
		let guildId = newVoiceState.channel?.guild.id as string
		let channelId = newVoiceState.channelID as string

		if (voiceChannel !== null) newVoiceState.channel?.guild.channels.create(voiceChannel.name + '-text', {
			permissionOverwrites: [ { id: guildId, deny: ['VIEW_CHANNEL'] }],
			type: ChannelType.text,
			parent: voiceChannel.parentID as string,
			position: voiceChannel.position
		})
			.then(ch => {
				ch.overwritePermissions([
					{
						id: guildId,
						deny: ['VIEW_CHANNEL'],
					},
					{
						id: user !== null ? user.id : "undefined",
						allow: ['VIEW_CHANNEL'],
					},
				]);
				let textChannelMap: TextChannelMap = { guildId: guildId, voiceChannelId: channelId , textChannelId: ch.id }
				this.mongoConnector.addTextChannel(textChannelMap)
				this.greet(ch, voiceChannel)
				

				if (this.onDebug) ch.send(`channel created for ${this.resolveUsername(user)}`); // test purposes only
			});
	}

	private resolve(voiceState: VoiceState, id: string): TextChannel {
		return voiceState.guild.channels.resolve(id) as TextChannel
	}

	private resolveUsername(user: GuildMember | null): string {
		return (user?.nickname !== undefined ? user?.nickname : user?.displayName) as string
	}

	private showHideTextChannel(textChannel: TextChannel, user: GuildMember | null, value: boolean) {
		if (user != null) textChannel.updateOverwrite(user, { VIEW_CHANNEL: value })
	}

	private async clearTextChannel(textChannel: TextChannel, voiceChannel: VoiceChannel) {
		let fetched: Collection<string, Message>;
		do {
		  fetched = await textChannel.messages.fetch({limit: 100});
		  textChannel.bulkDelete(fetched);
		}
		while(fetched.size >= 2)
		if(this.onDebug) textChannel.send("all messages deleted")
		this.greet(textChannel, voiceChannel)
	}

	private async greet(textChannel: TextChannel, voiceChannel: VoiceChannel | null) {
		if(voiceChannel !== null) {
			let intro = await this.mongoConnector.fetchIntro(voiceChannel.guild.id, voiceChannel.id)

			if(intro?.Description !== undefined) textChannel.send(intro.Description)
			if(intro?.ImageUrl !== undefined) textChannel.send(intro.ImageUrl)
			if(intro?.AdditionalUrl !== undefined) textChannel.send(intro.AdditionalUrl)
		}
	}
}