'use strict'

import { Client, Message, VoiceState, TextChannel, GuildMember } from 'discord.js'
import * as debug from 'debug'
import * as path from 'path'
import * as YAML from 'yamljs'
import * as textChannelHandler from './textChannelHandler'
import { Dictionary } from './Dictionary'

const logSystem = debug('bot:system')
const logEvent = debug('bot:event')
const logError = debug('bot:error')
const logWarn = debug('bot:warn')

export class Bot {
	private client: Client
	private config: any
	private allocations: Dictionary<string>

	constructor() {
		this.client = new Client()
		this.config = YAML.load(path.resolve(__dirname, 'config.yml'))
		this.allocations = new Dictionary<string>()
	}

	public start(): void {
		logSystem('Starting bot...')

		// => Bot is ready...
		this.client.on('ready', () => {
			logEvent(`[${this.config.settings.nameBot}] Connected.`)
			logEvent(`Logged in as ${this.client.user.tag}`)
			this.client.user.setActivity(this.config.settings.activity)	
		})

		// => Message handler
		this.client.on('message', (message: Message) => {
			// => Prevent message from the bot
			if (message.author.id !== this.client.user.id) {
				// => Test command
				if (message.content === this.config.settings.prefix + 'ping') {
					message.reply('Illuminati bot is ready and listening.')
				}
			}
		})

		this.client.on('voiceStateUpdate', (oldVoiceState, newVoiceState) => {
			let newUserChannel = oldVoiceState.channel;
			let oldUserChannel = newVoiceState.channel;


			if (oldUserChannel === undefined && newUserChannel !== undefined) {
				// User Joins a voice channel
				let userId = newVoiceState.member;
				let channelName = newVoiceState.channel?.name;
				newUserChannel?.guild.channels.create(channelName + '-text')
					.then(ch => {
						ch.updateOverwrite(userId, { VIEW_CHANNEL: oldUserChannel === undefined && newUserChannel !== undefined });
						ch.send("channel created");
					});
			}
			else if (newUserChannel === undefined) {
				// User leaves a voice channel
				let userId = newVoiceState.member;
				let channelName = newVoiceState.channel?.name;
				let textChannel = this.client.channels.cache.find("name", channelName + '-text') as TextChannel;
				textChannel.updateOverwrite(userId, { VIEW_CHANNEL: false });

			}
		});

		// => Bot error and warn handler
		this.client.on('error', logError)
		this.client.on('warn', logWarn)

		// => Process handler
		process.on('exit', () => {
			logEvent(`[${this.config.settings.nameBot}] Process exit.`)
			this.client.destroy()
		})
		process.on('uncaughtException', (err: Error) => {
			const errorMsg = (err ? err.stack || err : '').toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
			logError(errorMsg)
		})
		process.on('unhandledRejection', (err: Error) => {
			logError('Uncaught Promise error: \n' + err.stack)
		})

		// => Login
		this.client.login(this.config.settings.token)
	}
}