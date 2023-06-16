import React from 'react';

import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';

import { NativeWindStyleSheet } from 'nativewind';
import { AppRegistry } from 'react-native';

class Document extends NextDocument {
  static async getInitialProps(ctx: DocumentContext) {
    AppRegistry.registerComponent('Main', () => Main);
    // @ts-expect-error incorrect typings
    const { getStyleElement } = AppRegistry.getApplication('Main');
    const styles = [getStyleElement()];

    const initialProps = await NextDocument.getInitialProps(ctx);
    return { ...initialProps, styles: React.Children.toArray(styles) };
  }

  render() {
    return (
      <Html lang="en" style={NativeWindStyleSheet.getSSRStyles()}>
        <Head>
          <meta charSet="UTF-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="application-name" content="MetaFactory" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-touch-fullscreen" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta name="apple-mobile-web-app-title" content="MetaFactory" />
          <meta
            name="description"
            content="Shop, curate and collect digiphysical goods for the metaverse."
          />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#000000" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
