import * as debug from 'debug'
import { Client } from 'discord.js'

export class Logger {
    public logSystem = debug('bot:system')
    public logEvent = debug('bot:event')
    public logError = debug('bot:error')
    public logWarn = debug('bot:warn')

	public introduce(client: Client, config: any) {
		this.logEvent(`${config.settings.nameBot} Connected.`)
		this.logEvent(`Logged in as ${client.user != undefined ? client.user.tag : "undefined"}`)
		if(client.user != undefined) client.user.setActivity(config.settings.activity)
	}
}