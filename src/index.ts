import {
    AbstractTransactPlugin,
    Cancelable,
    Canceled,
    LocaleDefinitions,
    PromptResponse,
    TransactContext,
    TransactHookTypes,
} from '@wharfkit/session'

import defaultTranslations from './translations'

export interface MockOptions {
    prompt: boolean
    promptOptions: {
        continueOnDecline: boolean
        timeout: number
    }
    translations?: LocaleDefinitions
}

export class TransactPluginMock extends AbstractTransactPlugin {
    /** Define any translations for this plugin */
    public translations = defaultTranslations
    /** Set a unique ID for the plugin */
    public id = 'transact-plugin-mock'
    /** Save the options being passed specifically for this plugin */
    readonly options?: MockOptions
    constructor(options?: MockOptions) {
        super()
        this.options = options
    }
    /** Register any hooks required for the plugin to operate */
    register(context: TransactContext): void {
        context.addHook(TransactHookTypes.beforeSign, async (request, context) => {
            if (this.options?.prompt && context.ui) {
                // Retrieve translation helper from the UI, passing the app ID
                const t = context.ui.getTranslate(this.id)
                // Customize the body to present the developer with information about this prompt
                let body = t('body', {
                    default: 'An example prompt from the TransactPluginMock for testing purposes.',
                })
                if (this.options.promptOptions.timeout) {
                    body +=
                        ' ' +
                        t('timeout', {
                            default: `This prompt will automatically cancel in {{timeout}} seconds.`,
                            timeout: this.options.promptOptions.timeout / 1000,
                        })
                }
                // Initiate a new cancelable prompt to inform the user of the fee required
                console.log('TransactPluginMock called context.ui.prompt().')
                const prompt: Cancelable<PromptResponse> = context.ui.prompt({
                    title: t('title', {default: 'Example Prompt!'}),
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
                    const {timeout} = this.options.promptOptions
                    timer = setTimeout(() => {
                        console.log('TransactPluginMock setTimeout has executed.')
                        if (!context.ui) {
                            throw new Error('No UI defined')
                        }
                        prompt.cancel(
                            t('timeout-trigger', {
                                default: `Test prompt timed out automatically after {{timeout}} seconds.`,
                                timeout: timeout / 1000,
                            })
                        )
                    }, timeout)
                }

                // Return the promise from the prompt
                return prompt
                    .then(async () => {
                        // If the prompt was accepted, return the request
                        console.log('Prompt was accepted and returned to TransactPluginMock.')
                        return
                    })
                    .catch((e) => {
                        // Throw if what we caught was a cancelation of the prompt to abort
                        if (e instanceof Canceled) {
                            console.log('Prompt was cancelled and TransactPluginMock threw error.')
                            throw e
                        }
                        // Determine if we should continue if the prompt was rejected, defaults to true.
                        let continueOnDecline = true
                        if (
                            this.options &&
                            this.options.promptOptions &&
                            this.options.promptOptions.continueOnDecline !== undefined
                        ) {
                            continueOnDecline = this.options.promptOptions.continueOnDecline
                        }
                        if (continueOnDecline) {
                            // If the prompt was rejected, and we're configured to continue, return the request
                            console.log('Prompt was rejected and returned to TransactPluginMock.')
                            // Otherwise if it wasn't a cancel, it was a reject, and continue without modification
                            console.log('returning void')
                            return
                        } else {
                            // Otherwise if it was rejected and we shouldn't continue, and throw an error
                            console.log('Prompt was rejected and threw an error.')
                            throw e
                        }
                    })
                    .finally(() => {
                        // Always cleanup the timer
                        if (timer) {
                            console.log('Prompt timer was cleared.')
                            clearTimeout(timer)
                        }
                    })
            }
        })
    }
}
