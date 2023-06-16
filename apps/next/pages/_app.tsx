import React from 'react';

import Head from 'next/head';

import type { SolitoAppProps } from 'solito';

import { api } from 'app/lib/api';
import { Provider } from 'app/provider';

import 'raf/polyfill';

import '../global.css';
import '@rainbow-me/rainbowkit/styles.css';

// FIXME need reanimated update, see https://github.com/software-mansion/react-native-reanimated/issues/3355
if (process.browser) {
  // @ts-expect-error temp fix
  window._frameTimestamp = null;
}

function MyApp({ Component, pageProps }: SolitoAppProps) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <title>MetaFactory</title>
        <meta
          name="description"
          content="Shop, curate and collect digiphysical goods for the metaverse."
        />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="150x150"
          href="/robotFaceGreen.png"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/appIcon.png" />
      </Head>
      <Provider>{getLayout(<Component {...pageProps} />)}</Provider>
    </>
  );
}

export default api.withTRPC(MyApp);
