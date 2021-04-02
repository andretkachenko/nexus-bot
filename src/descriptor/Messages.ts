export class Messages {
    public static readonly ProcessExit = "Process exit"
    public static readonly StartingBot = "Starting bot..."
    public static readonly BotConnected = "Bot Connected"
    public static readonly LoggedAs = "Logged in as "
    public static readonly UnhandledRejection = "Uncaught Promise rejection"
    public static readonly DiscordWarn = "Discord Client Warning"
    public static readonly PingResponse = "alive and waiting for your commands"
    public static readonly SkipError = "Error occured during processing of one of the mentioned users/roles"
    public static readonly InvalidChannelId = "invalid channel Id"
    public static readonly ErrorProcessingChannelId = "Error processing channel "
    public static readonly DMNotSupported = "Direct messages are not supported"
    public static readonly CommandProcessError = "Error processing command - "
    public static readonly MissingGuild = "unable to identify server"
    public static readonly NotVoiceChannelId = "specified channel ID does not belong to a voice channel"

    public static readonly FollowLink = "Follow this link: "
    public static readonly SuggestVia = "You can suggest it via "

    public static StatusString(prefix: string, number: number): string { return `${prefix}help on ${number} servers`}
}