export enum ClientEvent {
	channelDelete = 'channelDelete', // Intent: GUILDS
	error = 'error',
	guildDelete = 'guildDelete', // Intent: GUILDS
	messageCreate = 'messageCreate', // Intent: GUILD_MESSAGES or DIRECT_MESSAGES
	messageUpdate = 'messageUpdate', // Intent: GUILD_MESSAGES or DIRECT_MESSAGES
	ready = 'ready',
	voiceStateUpdate = 'voiceStateUpdate', // Intent: GUILD_VOICE_STATES
	warn = 'warn',

	interactionCreate = 'interactionCreate'
}