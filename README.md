# MetaFactory App Monorepo

Monorepo with Expo/React Native Web + Next.js + TypeScript. Uses yarn workspaces.

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
