export class Messages {
	public static readonly processExit = 'Process exit'
	public static readonly startingBot = 'Starting bot...'
	public static readonly botConnected = 'Bot Connected'
	public static readonly loggedAs = 'Logged in as '
	public static readonly unhandledRejection = 'Uncaught Rejection'
	public static readonly discordWarn = 'Discord Client Warning'
	public static readonly pingResponse = 'alive and waiting for your commands'
	public static readonly skipError = 'Error occured during processing of one of the mentioned users/roles'
	public static readonly invalidVoiceChannelId = 'invalid Voice Channel ID'
	public static readonly invalidTextChannelId = 'invalid Text Channel ID'
	public static readonly errorProcessingChannelId = 'Error processing channel '
	public static readonly mapError = 'Error occured during processing voice/text channel mapping'
	public static readonly voiceChannelMapped = 'Voice Channel already has mapped Text Channel'
	public static readonly textChannelMapped = 'Text Channel is already mapped to a Voice Channel'
	public static readonly voiceMapEditNotice = 'The Voice Channel already had a mapped Text Channel. Changed to map with the Text Channel #'
	public static readonly textMapDeleteNotice = 'The Text Channel was already mapped to a Voice Channel. Deleted mapping with the Voice Channel #'
	public static readonly textMapCreateNotice = 'Mapped the Text Channel with the Voice Channel #'
	public static readonly dmNotSupported = 'Direct messages are not supported'
	public static readonly commandProcessError = 'Error processing command - '
	public static readonly missingGuild = 'unable to identify server'
	public static readonly notVoiceChannelId = 'specified channel ID does not belong to a voice channel'

	public static readonly followLink = 'Follow this link: '
	public static readonly suggestVia = 'You can suggest it via '

	public static statusString(prefix: string, amt: number): string { return `${prefix}help on ${amt} servers`}
}