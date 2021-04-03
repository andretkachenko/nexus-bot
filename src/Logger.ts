/* eslint-disable no-console */
import { Constants } from './descriptor'

export class Logger {
	public logSystem(message: string): void {
		console.log(`${Constants.systemMarker} ${message}`)
	}

	public logEvent(message: string): void {
		console.log(message)
	}

	public logError(className: string, methodName: string, message: string, parameters: string = Constants.emptyString): void {
		console.log(`${Constants.errorMarker} ${className}.${methodName}(${parameters}) - ${message}`)
	}

	public logWarn(message: string): void {
		console.log(`${Constants.warnMarker} ${message}`)
	}
}