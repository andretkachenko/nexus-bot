import * as debug from 'debug'
import { Client } from 'discord.js'
import { Config } from '../config'

export class Logger {
    public logSystem = debug('bot:system')
    public logEvent = debug('bot:event')
    public logError = debug('bot:error')
    public logWarn = debug('bot:warn')

	public introduce(client: Client, config: Config) {
		this.logEvent(`nexus-bot Connected.`)
		this.logEvent(`Logged in as ${client.user ? client.user.tag : "undefined"}`)
		if(client.user) client.user.setActivity({ "name": `${config.prefix}help`, "type": "LISTENING" })
	}
}