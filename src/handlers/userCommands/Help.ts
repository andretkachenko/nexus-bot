import { Message, MessageEmbed } from 'discord.js'
import { Config } from '../../config'
import { Constants } from '../../descriptor'
import { BotCommand } from '../../enums'
import { Logger } from '../../Logger'
import { BaseHandler } from './BaseHandler'

export class Help extends BaseHandler {
	private img: string
	private prefix: string

	constructor(logger: Logger, config: Config) {
		super(logger, config.prefix + BotCommand.help)
		this.img = config.img
		this.prefix = config.prefix
	}

	protected process(message: Message): void {
		const embed = new MessageEmbed()
			.setColor(Constants.embedInfoColor)
			.setAuthor(Constants.embedTitle, this.img, Constants.repoUrl)
			.addField('**How to use**',
				`You don't need to set up anything - once you join a voice channel (excluding inactive channel), a new category with the linked text channel will be created.
            Each time user joins/leaves voice channel, he will get/lose rights to see the linked text channel.
            Feel free to rename/move categories and text channels as you wish - it will not affect bot.
            When the last user leaves the voice channel, messages in the linked text channel will be deleted (excluding pinned messages).`)
			.addField('**List of available commands**', `
            {} - 'replace with id', [] - choose one option, @{} - mention user/role
            **${this.prefix}write** - repeat message that was written by the user. Can be used to send a system message to the channel. Requires user to have admin rights.
            **${this.prefix}ignore [0/1] {channelId}** - ignore/handle voice channel with the specified id when checking for linked text channel. Example: \`${this.prefix}ignore 1 71782400863633ss4130\`. Requires user to have admin rights.
            **${this.prefix}skip [0/1] @{user/role}** - skip/change visibility settings for specific user/role. Supports multiple mentions. Example: \`${this.prefix}skip 1 @User1 @Role1 @User2\`. Requires user to have admin rights.
            **${this.prefix}preserve [0/1] {channelId}** - set linked text channel to save messages after the last user left the voice channel. \`channelId\` - id of the voice channel. Example: \`${this.prefix}preserve 1 717824008636334130\`. Requires user to have admin rights.
            `)
			.addField('**Danger zone! Use with caution!**', `**${this.prefix}map [0/1] {voiceChannelId} {textChannelId}** - map voice and text channels together. 1 means override existing mapings.`)
			.addField('**Want to use it on your server?**', 'Follow this link: ' + Constants.repoUrl+Constants.inviteGuideUri)
			.addField('**Any issues or missing feature?**', 'You can suggest it via ' + Constants.repoUrl+Constants.issuesUri)
		message.channel.send(embed)
			.catch(reason => this.logger.logError(this.constructor.name, this.process.name, reason))
	}

	protected hasPermissions(_message: Message): boolean {
		return true
	}
}