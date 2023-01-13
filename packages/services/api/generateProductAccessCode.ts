import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

import { LocksmithLockResponse } from '../types/locksmith';
import { getOrCreateLock, isCodeRedeemed } from '../utils/lockHelpers';
import { isValidAuthToken } from '../utils/userHelpers';
import {
  LOCKSMITH_ACCESS_TOKEN,
  LOCKSMITH_ENDPOINT,
  SHOP_DOMAIN,
} from 'shared/config/secret';

// Allows an authenticated API user to generate access codes for a given product lock and unique identifier.
// Uses basic auth to protect the API. Saving the mapping of user to access code in the database to prevent the
// same user from generating multiple codes.
//
// Product lock must first be created in the Locksmith app in Shopify, then the script to generate access codes should
// be run which will insert the codes and lockId into the database. These generated codes should then be pasted into
// the product lock page in Locksmith, ensuring the condition is (gives passcode AND liquid {% if request.page_type == "product" %}).
// https://docs.uselocksmith.com/article/166-secret-link-keys
export default async (req: VercelRequest, res: VercelResponse) => {
  const { isValid } = await isValidAuthToken(req.headers.authorization);

  if (!isValid) {
    res.status(401).send('Unauthorized');
    return;
  }

  let { lockId, uniqueIdentifier } = req.query;

  if (!lockId || !uniqueIdentifier) {
    res.status(400).send('Must provide lockId and uniqueIdentifier');
    return;
  }

  if (typeof lockId !== 'string') [lockId] = lockId;
  if (typeof uniqueIdentifier !== 'string')
    [uniqueIdentifier] = uniqueIdentifier;

  const userLock = await getOrCreateLock(lockId, uniqueIdentifier);

  if (!userLock) {
    res.status(404).send('Unable to find product or no codes remaining');
    return;
  }

  const response = await fetch(`${LOCKSMITH_ENDPOINT}/locks/${lockId}`, {
    headers: {
      'x-shopify-shop-domain': SHOP_DOMAIN,
      'x-locksmith-access-token': LOCKSMITH_ACCESS_TOKEN,
    },
  });

  const data = (await response.json()) as LocksmithLockResponse;
  const isRedeemed = isCodeRedeemed(userLock.access_code, data);

  res.json({
    // eslint-disable-next-line no-underscore-dangle
    url: data._resource_url,
    accessCode: userLock.access_code,
    uniqueIdentifier: userLock.customer_eth_address,
    isRedeemed,
  });
};
