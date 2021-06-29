# MetaFactory App Monorepo

Monorepo with Expo/React Native Web + Next.js + TypeScript. Uses yarn workspaces.

# GETTING STARTED

- Before you begin, you should ensure you run 'yarn install' at root directory, the post install script should take care of all injections etc. with the libraries required that aren't nativly supported by expo.

- If you run into any linking issues (missing 'stream' or 'aynscstorage') you likely just need to close the server/localhost page before switching from web to native apps (ios/android) and vice versa, as we depend on package injection the auto generated files of expo/react-native-web need to be refreshed between platforms.

# Folders

- `packages/components` (import as `@mf/components`)
  - Make sure to add any other package folders you make to `app/next.config.js` after `next-transpile-modules`.
- `packages/app` (this is the app you run)

# Start app

- Clone the repo
- Run `yarn install`
- `yarn start` to run the expo app, `yarn web` to run next.js

# Edit code

Open `packages/components` and start editing. Watch changes happen instantly in your app.

# Practices

In order to run a yarn command in the `app` folder, you can prepend it with `yarn app`. For example, to install a package
in the app folder:

```sh
# add a package
yarn app add restyled
# install again at root so workspaces can work its magic
yarn install

# post install will inject the nessecery libraries for web3.js

```

The nice thing about the monorepo is that you only need each package to be in **one `package.json` file**. You don't need to add a dependency in every `package.json`. So we can use the main app as the entry point for basically every dependency.

You should also run `yarn install` at the root every time you add a package, since we use a `patch-package` `postinstall` script at the root folder.

# EAS Build

If you're using EAS from Expo, you might need to add packages to your `package.json`'s `expo-yarn-workspaces.symlinks` array.

For starters, you should create a separate folder called `native-app` or something like that. That's where your bare `expo` app should live.

Then you should put a `react-native` resolution in your root `package.json` to avoid version conflicts. Or, just make sure you have only one `react-native` in a package.json. It should be in your the package that has your bare app.

Put this in your **root package.json** if you want to avoid excessive callbacks as an error:

```json
{
  "resolutions": { "react-native": "0.63.4" }
}
```

If you encounter a build error indicating you don't have these, you should add them. Apparently Expo is working on making this step simpler with a single symlink.

Typically you have to do this:

- Install an expo package
- add it to the `symlinks` in `package.json` of your `packages/app`
- `yarn` inside of `packages/app` (to trigger `postinstall` and symlink)
- `cd ios`, `pod install`
- Run the expo app (`expo run:ios`)
