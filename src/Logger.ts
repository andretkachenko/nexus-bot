import { Constants } from "./descriptor"

export class Logger {
	public logSystem(message: string) {
		console.log(`${Constants.SystemMarker} ${message}`)
	}

	public logEvent(message: string) {
		console.log(message)
	}

	public logError(className: string, methodName: string, message: string, parameters: string = Constants.EmptyString) {
		console.log(`${Constants.ErrorMarker} ${className}.${methodName}(${parameters}) - ${message}`)
	}

	public logWarn(message: string) {
		console.log(`${Constants.WarnMarker} ${message}`)
	}
}