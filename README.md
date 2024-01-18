# @wharfkit/transact-plugin-mock

A mock TransactPlugin that can be used to simulate and test different Wharf Session Kit event types.

## Usage

Install the package:

```bash
npm install @wharfkit/transact-plugin-mock --save
# or
yarn add @wharfkit/transact-plugin-mock
```

To use this mock transact plugin, you must include it during SessionKit initialization:

```ts
import { TransactPluginMock } from '@wharfkit/transact-plugin-mock'

const sessionKit = new SessionKit(
  {
    // ...arguments
  },
  {
    transactPlugins: [new TransactPluginMock()],
  }
)
```

For more information on how to use Transact plugins, see the [SessionKit documentation](https://wharfkit.com/docs/session-kit/plugin-transact).

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make lint`.

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com), if you find this useful please consider [supporting us](https://greymass.com/support-us).
