import { VoiceState, TextChannel, GuildMember, Collection, Message, VoiceChannel } from "discord.js";
import { Dictionary } from "../collections/Dictionary";
import { ChannelType } from "../enums/ChannelType"
import { EnvType } from "../enums/EnvType";

export class ChannelOperator {
	private channelMap: Dictionary<string>

	constructor() {
		this.channelMap = new Dictionary<string>()
	}

	public handleChannelJoin(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let channelID = newVoiceState.channelID as string

		if (this.channelMap.ContainsKey(channelID)) {
			let textChannel = this.resolve(newVoiceState, channelID) as TextChannel
			this.showHideTextChannel(textChannel, user, true)

			if (process.env.NODE_ENV === EnvType.Debug) textChannel?.send(`${this.resolveUsername(user)} joined channel ${textChannel.name}`) // test purposes only
		}
		else {
			this.createTextChannel(newVoiceState)
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
			if (voiceChannel?.members.size !== undefined && voiceChannel?.members.size <= 0) {
				this.clearTextChannel(textChannel)
			}
		}
	}

	private createTextChannel(newVoiceState: VoiceState) {
		let user = newVoiceState.member
		let voiceChannel = newVoiceState.channel
		let channelID = newVoiceState.channelID as string

		if (voiceChannel !== null) newVoiceState.channel?.guild.channels.create(voiceChannel.name + '-text', {
			permissionOverwrites: [ { id: newVoiceState.channel.guild.id, deny: ['VIEW_CHANNEL'] }],
			type: ChannelType.text,
			parent: voiceChannel.parentID as string,
			position: voiceChannel.position + 1
		})
			.then(ch => {
				ch.overwritePermissions([
					{
						id: ch.guild.id,
						deny: ['VIEW_CHANNEL'],
					},
					{
						id: user !== null ? user.id : "undefined",
						allow: ['VIEW_CHANNEL'],
					},
				]);
				this.channelMap.Add(channelID, ch.id)
				this.greet(ch, voiceChannel)
				

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

	private async clearTextChannel(textChannel: TextChannel) {
		let fetched: Collection<string, Message>;
		do {
		  fetched = await textChannel.messages.fetch({limit: 100});
		  textChannel.bulkDelete(fetched);
		}
		while(fetched.size >= 2);
	}

	private greet(textChannel: TextChannel, voiceChannel: VoiceChannel | null) {
		if(voiceChannel !== null) textChannel.send(`!${voiceChannel.name}`)
	}
}