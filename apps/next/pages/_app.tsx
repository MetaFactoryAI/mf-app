import { Provider } from 'app/provider';
import Head from 'next/head';
import React from 'react';
import type { SolitoAppProps } from 'solito';
import 'raf/polyfill';
import '../global.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Session } from 'next-auth';

// FIXME need reanimated update, see https://github.com/software-mansion/react-native-reanimated/issues/3355
if (process.browser) {
  // @ts-expect-error temp fix
  window._frameTimestamp = null;
}

function MyApp({
  Component,
  pageProps,
}: SolitoAppProps<{
  session: Session;
}>) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <title>MetaFactory</title>
        <meta
          name="description"
          content="Shop, curate and collect digiphysical goods for the metaverse."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Provider session={pageProps.session}>
        {getLayout(<Component {...pageProps} />)}
      </Provider>
    </>
  );
}

export default MyApp;
