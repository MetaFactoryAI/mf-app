# MetaFactory App Monorepo

Monorepo with Expo/React Native Web + Next.js + TypeScript. Uses yarn workspaces.

# Folders

- `packages/components` (import as `@mf/components`)
  - Make sure to add any other package folders you make to `app/next.config.js` after `next-transpile-modules`.
- `packages/expo-app` (this is the app you run)

# Start app

- Clone the repo
- Run `yarn install`
- `yarn native` to run the expo app, `yarn web` to run next.js

# Edit code

Open `packages/components` and start editing. Watch changes happen instantly in your app.

# Practices

I tend to install 99% of my packages directly in the `expo-app` folder. It usually looks like this:

```sh
# open the app
cd package/expo-app
# add a package
yarn add restyled
# go back to the root
cd ../..
# install again
yarn install

# post install will inject the nessecery node.js libraries for web3.js
# you will need to set stream in package.json under 'react-native' to:
#    "stream": "react-native-stream",
# This is not ideal, and is a pain for injecting - looking into how we can avoid this.
```

The nice thing about the monorepo is that you only need each package to be in **one `package.json` file**. You don't need to add a dependency in every `package.json`. So I use my main app as the entry point for basically every dependency.

I also run `yarn install` at the root every time I add a package, since I use a `patch-package` `postinstall` script at the root folder.

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
