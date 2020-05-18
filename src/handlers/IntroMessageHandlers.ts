import { Dictionary } from "../collections/Dictionary";
import { IntroPictureMap } from "../entities/IntroPictureMap";
import { ChannelType } from "../enums/ChannelType"
import { Message, Guild } from "discord.js";

export class IntroMessageHandlers {
    private readonly wrongChannelType = "wrong-channel-type";
    private readonly faultyGuild = "faulty-guild";

    public introMessageMap: Dictionary<IntroPictureMap>
    private config: any

    constructor(config: any) {
        this.introMessageMap = new Dictionary<IntroPictureMap>()
        this.config = config
    }

    public registerIntroMessage(message: Message) {
        let expectedCmd = this.config.settings.prefix + 'addintro'
        if (message.content.indexOf(expectedCmd) !== -1) {
            let map = message.content.substring(expectedCmd.length)
            let introPictureMap: IntroPictureMap = JSON.parse(map)

            let channelId = this.getChannelId(message, introPictureMap.ChannelName)
            if (channelId === this.faultyGuild) {
                message.channel.send("Error processing command - unable to identify guild.")
                return
            }
            if (channelId === this.wrongChannelType) {
                message.channel.send("Error processing command - specified channel name does not belong to a voice channel.")
                return
            }

            this.introMessageMap.Add(channelId, introPictureMap)
        }
    }

    private getChannelId(message: Message, channelName: string): string {
        if (message.guild != null) {
            let channel = message.guild.channels.cache.find(ch => ch.name === channelName)
            return channel?.type === ChannelType.voice ? channel.id : this.wrongChannelType
        } else {
            return this.faultyGuild
        }
    }
}