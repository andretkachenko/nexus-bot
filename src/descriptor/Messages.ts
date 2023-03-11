import { Constants } from './Constants'

export class Messages {
	public static readonly processExit = 'Process exit'
	public static readonly startingBot = 'Starting bot...'
	public static readonly botConnected = 'Bot Connected'
	public static readonly loggedAs = 'Logged in as '
	public static readonly unhandledRejection = 'Uncaught Rejection'
	public static readonly discordWarn = 'Discord Client Warning'
	public static readonly pingResponse = 'alive and waiting for your commands'
	public static readonly skipError = 'Error occured during processing of one of the mentioned users/roles'
	public static readonly invalidTextChannelId = 'invalid Text Channel ID'
	public static readonly errorProcessingChannelId = 'Error processing channel '
	public static readonly voiceChannelMapped = 'Voice Channel already has mapped Text Channel'
	public static readonly textChannelMapped = 'Text Channel is already mapped to a Voice Channel'
	public static voiceMapEditNotice(id: string): string { return `The Voice Channel already had a mapped Text Channel. Changed to map with the Text Channel <#${id}>` }
	public static textMapDeleteNotice(id: string): string { return `The Text Channel was already mapped to a Voice Channel. Deleted mapping with the Voice Channel <#${id}>` }
	public static textMapCreateNotice(id: string): string { return `Mapped the Text Channel with the Voice Channel <#${id}>` }
	public static readonly dmNotSupported = 'Direct messages are not supported'
	public static readonly commandProcessError = 'Error processing command - '
	public static readonly missingGuild = 'unable to identify server'
	public static readonly notVoiceChannelId = 'specified channel ID does not belong to a voice channel'
	public static readonly unknownLinkError = `Unknown error. Please raise a ticket at ${Constants.repoUrl+Constants.issuesUri}`

	public static joinMessage(id: string): string { return `<@${id}> joined the channel`}
	public static leftMessage(id: string): string { return `<@${id}> left the channel`}

	public static statusString(amt: number): string { return `${amt} servers`}
}