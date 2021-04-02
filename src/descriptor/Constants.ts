export class Constants {
    public static readonly Enable = "1"
    public static readonly EmptyString = ''
    public static readonly Repository = "Repository"

    public static readonly EmbedTitle = "Nexus Bot - link voice and text channels"
    public static readonly EmbedInfoColor = "#0099ff"
    public static readonly RepoUrl = "https://github.com/andretkachenko/nexus-bot"
    public static readonly IssuesUri = "/issues"
    public static readonly InviteGuideUri = "#want-to-use-at-your-server"

    public static readonly CategoryName = "Nexus channels"
    public static readonly TextSuffix = '-text'

    public static readonly Listening = "LISTENING"
    public static readonly Undefined = "undefined"

    public static readonly SystemMarker = '[SYS]'
    public static readonly ErrorMarker = '[ERR]'
    public static readonly WarnMarker = '[WAR]'

    public static MakeBold(content: string): string { return `**${content}**`}
}