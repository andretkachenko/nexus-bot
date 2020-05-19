import { Dictionary } from "../collections/Dictionary";
import { IntroPictureMap } from "../entities/IntroPictureMap";
import { ChannelType } from "../enums/ChannelType"
import { Message, Guild, TextChannel, NewsChannel, DMChannel } from "discord.js";
import { Config } from "../config";

export class IntroMessageHandlers {
    private readonly wrongChannelType = "wrong-channel-type";
    private readonly faultyGuild = "faulty-guild";

    public introMessageMap: Dictionary<IntroPictureMap>
    private config: Config

    constructor(config: Config) {
        this.introMessageMap = new Dictionary<IntroPictureMap>()
        this.config = config
    }

    public updateIntroMessage(message: Message) {
        this.insertIntroMessage(message, "changeIntro", true)
    }

    public registerIntroMessage(message: Message) {
        this.insertIntroMessage(message, "changeIntro", false)
    }

    public insertIntroMessage(message: Message, expectedCmd: string, update: boolean) {
        if (message.content.indexOf(expectedCmd) !== -1) {
            let map = message.content.substring(expectedCmd.length)
            let introPictureMap: IntroPictureMap = JSON.parse(map)

            let channelId = this.getChannelId(message, introPictureMap.ChannelName)
            this.validateChannelId(message.channel, channelId)

            if(update && this.introMessageMap.ContainsKey(channelId)) this.introMessageMap.Remove(channelId)
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

    private validateChannelId(textChannel: TextChannel | NewsChannel | DMChannel, channelId: string) {

        if (channelId === this.faultyGuild) {
            textChannel.send("Error processing command - unable to identify guild.")
            return
        }
        if (channelId === this.wrongChannelType) {
            textChannel.send("Error processing command - specified channel name does not belong to a voice channel.")
            return
        }
    }
}