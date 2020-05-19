import * as debug from 'debug'
import { Client } from 'discord.js'
import { Config } from '../config'

export class Logger {
    public logSystem = debug('bot:system')
    public logEvent = debug('bot:event')
    public logError = debug('bot:error')
    public logWarn = debug('bot:warn')

	public introduce(client: Client, config: Config) {
		this.logEvent(`Illuminati-bot Connected.`)
		this.logEvent(`Logged in as ${client.user != undefined ? client.user.tag : "undefined"}`)
		if(client.user != undefined) client.user.setActivity({ "name": "to your demands", "type": "LISTENING" })
	}
}