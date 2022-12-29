import React from 'react';
import { AppRegistry } from 'react-native';
import { NativeWindStyleSheet } from 'nativewind';

import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';

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
