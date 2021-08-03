import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

import { LocksmithLockResponse } from '../types/locksmith';
import { CONFIG } from '../utils/config';
import { getOrCreateLock } from '../utils/lockHelpers';
import { isValidAuthToken } from '../utils/userHelpers';

// Allows an authenticated API user to generate access codes for a given product lock and customer ETH address.
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

  let { lockId, ethAddress } = req.query;

  if (!lockId || !ethAddress) {
    res.status(400).send('Must provide lockId and ethAddress');
    return;
  }

  if (typeof lockId !== 'string') [lockId] = lockId;
  if (typeof ethAddress !== 'string') [ethAddress] = ethAddress;

  const userLock = await getOrCreateLock(lockId, ethAddress);

  if (!userLock) {
    res.status(404).send('Unable to find product or no codes remaining');
    return;
  }

  const response = await fetch(`${CONFIG.locksmithEndpoint}/locks/${lockId}`, {
    headers: {
      'x-shopify-shop-domain': CONFIG.shopDomain,
      'x-locksmith-access-token': CONFIG.locksmithAccessToken,
    },
  });

  const data = (await response.json()) as LocksmithLockResponse;

  res.json({
    // eslint-disable-next-line no-underscore-dangle
    url: data._resource_url,
    accessCode: userLock.access_code,
    customerEthAddress: userLock.customer_eth_address,
  });
};
