import {
    AbstractTransactPlugin,
    Cancelable,
    Canceled,
    PromptResponse,
    TransactContext,
    TransactHookResponse,
    TransactHookTypes,
} from '@wharfkit/session'

export interface MockOptions {
    prompt: boolean
    promptOptions: {
        timeout: number
    }
}

export class TransactPluginMock extends AbstractTransactPlugin {
    readonly options?: MockOptions
    constructor(options?: MockOptions) {
        super()
        this.options = options
    }
    register(context: TransactContext): void {
        context.addHook(TransactHookTypes.beforeSign, async (request, context) => {
            if (this.options?.prompt && context.ui) {
                // Customize the body to present the developer with information aboutt this prompt
                let body = 'An example prompt from the TransactPluginMock for testing purposes.'
                if (this.options.promptOptions.timeout) {
                    body = `${body} This prompt will automatically cancel in ${this.options.promptOptions.timeout} seconds.`
                }

                // Initiate a new cancelable prompt to inform the user of the fee required
                console.log('TransactPluginMock called context.ui.prompt().')
                const prompt: Cancelable<PromptResponse> = context.ui.prompt({
                    title: 'Example Prompt!',
                    body,
                    elements: [
                        {
                            type: 'accept',
                        },
                    ],
                })

                // Create a timer to test the external cancelation of the prompt, if defined
                let timer
                if (this.options.promptOptions.timeout) {
                    console.log('TransactPluginMock setTimeout has begun.')
                    const {timeout} = this.options.promptOptions
                    timer = setTimeout(() => {
                        console.log('TransactPluginMock setTimeout has executed.')
                        prompt.cancel(
                            `Test prompt timed out automatically after ${timeout / 1000} seconds.}`
                        )
                    }, timeout)
                }

                // Return the promise from the prompt
                return prompt
                    .then(async () => {
                        // If the prompt was accepted, return the request
                        console.log('Prompt was accepted and returned to TransactPluginMock.')
                        return new Promise((r) => r({request})) as Promise<TransactHookResponse>
                    })
                    .catch((e) => {
                        // Throw if what we caught was a cancelation
                        if (e instanceof Canceled) {
                            console.log('Prompt was cancelled and TransactPluginMock threw error.')
                            throw e
                        }
                        console.log('Prompt was rejected and returned to TransactPluginMock.')
                        // Otherwise if it wasn't a cancel, it was a reject, and continue without modification
                        return new Promise((r) => r({request})) as Promise<TransactHookResponse>
                    })
                    .finally(() => {
                        // Always cleanup the timer
                        if (timer) {
                            console.log('Prompt timer was cleared.')
                            clearTimeout(timer)
                        }
                    })
            }
            return {
                request,
            }
        })
    }
}
