
import { SlashCommandBuilder } from '@discordjs/builders'

export class PingSlash {
	public data: SlashCommandBuilder

	constructor() {

		this.data = new SlashCommandBuilder()
			.setName('ping')
			.setDescription('Test slash commands')
	}
}