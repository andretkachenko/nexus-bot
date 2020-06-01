import { IntroMap } from "../entities/IntroMap";
import { ChannelType } from "../enums/ChannelType"
import { Message, TextChannel, NewsChannel, DMChannel, Client } from "discord.js";
import { MongoConnector } from "../db/MongoConnector";
import { Config } from "../config";

export class IntroMessageHandlers {
    private readonly wrongChannelType = "wrong-channel-type";
    private readonly faultyGuild = "faulty-guild";

    private mongoConnector: MongoConnector
    private client: Client
    private config: Config

    constructor(client: Client, mongoConnector: MongoConnector, config: Config) {
        this.mongoConnector = mongoConnector
        this.client = client
        this.config = config
    }

    public updateIntroMessage(message: Message) {
        this.insertIntroMessage(message, this.config.prefix + "changeintro", true)
    }

    public registerIntroMessage(message: Message) {
        this.insertIntroMessage(message, this.config.prefix + "addintro", false)
    }

    public async insertIntroMessage(message: Message, expectedCmd: string, update: boolean) {
        if (this.client.user != undefined && message.author.id !== this.client.user.id) {
            if (message.content.indexOf(expectedCmd) !== -1) {
                let map = message.content.substring(expectedCmd.length + 1)
                try {
                    let introPictureMap: IntroMap = JSON.parse(map)
                    let isValid = this.validateChannelId(message.channel, introPictureMap.ChannelId, introPictureMap.GuildId)

                    if (isValid) {
                        if(introPictureMap.GuildId === null || introPictureMap.GuildId === undefined) introPictureMap.GuildId = message.guild?.id as string

                        introPictureMap.GuildId = introPictureMap.GuildId.trim()
                        introPictureMap.ChannelId = introPictureMap.ChannelId.trim()

                        if (update) this.mongoConnector.introRepository.update(introPictureMap)
                        else this.mongoConnector.introRepository.add(introPictureMap)
                    }
                }
                catch (e) {
                    console.log(e)
                    message.channel.send("Error parsing provided intro")
                }
            }
        }
    }

    private validateChannelId(textChannel: TextChannel | NewsChannel | DMChannel, channelId: string, guildId: string): boolean {
        let isValid = true
        let message = ''
        if (textChannel.type === ChannelType.dm && (guildId === undefined || guildId === null)) {
            message = "Error processing command - guildId should be specified while using direct messages."
            isValid = false
        }
        if ((textChannel.type === ChannelType.news || textChannel.type === ChannelType.text) && ((textChannel as TextChannel | NewsChannel).guild === null || (textChannel as TextChannel | NewsChannel).guild === undefined)) {
            message = "Error processing command - unable to identify guild."
            isValid = false
        }
        if (isValid) {
            let desiredGuildId = (textChannel as DMChannel).type ? guildId : (textChannel as TextChannel | NewsChannel).guild.id
            let guild = this.client.guilds.resolve(desiredGuildId.trim())
            if (guild === null || guild == undefined) {
                message = "Error processing command - unable to identify guild."
                isValid = false
            } else {
                let channel = guild.channels.resolve(channelId)
                if (channel?.type !== ChannelType.voice) {
                    message = "Error processing command - specified channelId does not belong to a voice channel."
                    isValid = false
                }
            }
        }

        if (message !== '') textChannel.send(message)
        return isValid
    }
}