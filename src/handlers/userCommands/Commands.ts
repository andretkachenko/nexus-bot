import { Message,
	MessageEmbed
} from 'discord.js'
import { Config } from '../../config'
import { Messages } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './.'

export class Commands extends BaseHandler {
	constructor(logger: Logger, config: Config) {
		super(logger, config, BotCommand.commands)
	}

	protected process(message: Message): void {
		message.channel.send(Messages.pingResponse)
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	protected hasPermissions(_message: Message): boolean {
		return true
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField('List of available commands', `
		{} - 'replace with id', [] - choose one option, @{} - mention user/role
		**${this.prefix}write** - repeat message that was written by the user. Can be used to send a system message to the channel.
		**${this.prefix}ignore [0/1] {channelId}** - ignore/handle voice channel with the specified id when checking for linked text channel.
		**${this.prefix}skip [0/1] @{user/role}** - skip/change visibility settings for specific user/role. Supports multiple mentions.
		**${this.prefix}preserve [0/1] {channelId}** - set linked text channel to save messages after the last user left the voice channel.
		**${this.prefix}map [0/1] {voiceChannelId} {textChannelId}** - map voice and text channels together.
		`)
			.addField('Informational commands', `
        To get detailed explanation of any command, write help with the name of a command. For example: "**${this.prefix}help write**"
        **${this.prefix}help channelId - explanation how to find channelId/guildId
        **${this.prefix}help whoops** - notes in case of bot's malfunctioning
        `)
	}
}