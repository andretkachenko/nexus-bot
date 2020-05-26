import { IntroMap } from "../entities/IntroMap";
import { ChannelType } from "../enums/ChannelType"
import { Message, TextChannel, NewsChannel, DMChannel, Client } from "discord.js";
import { MongoConnector } from "../db/MongoConnector";

export class IntroMessageHandlers {
    private readonly wrongChannelType = "wrong-channel-type";
    private readonly faultyGuild = "faulty-guild";

    private mongoConnector: MongoConnector
    private client: Client

    constructor(client: Client, mongoConnector: MongoConnector) {
        this.mongoConnector = mongoConnector
        this.client = client
    }

    public updateIntroMessage(message: Message) {
        this.insertIntroMessage(message, "changeintro", true)
    }

    public registerIntroMessage(message: Message) {
        this.insertIntroMessage(message, "addintro", false)
    }

    public insertIntroMessage(message: Message, expectedCmd: string, update: boolean) {
        if (this.client.user != undefined && message.author.id !== this.client.user.id) {
            if (message.content.indexOf(expectedCmd) !== -1) {
                let map = message.content.substring(expectedCmd.length+1)
                try {
                    let introPictureMap: IntroMap = JSON.parse(map)

                    let guildId = message.guild?.id as string
                    let channelId = this.getChannelId(message, introPictureMap.ChannelName)
                    this.validateChannelId(message.channel, channelId)

                    if (update && guildId !== null && this.mongoConnector.fetchIntro(guildId, channelId) !== undefined) this.mongoConnector.deleteIntro(guildId, channelId)
                    if (this.mongoConnector.fetchIntro(guildId, channelId) === undefined) {
                        introPictureMap.GuildId = guildId
                        introPictureMap.ChannelId = channelId
                        this.mongoConnector.addIntro(introPictureMap)
                    }
                }
                catch (e) {
                    console.log(e)
                    message.channel.send("Error parsing provided intro")
                }
            }
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