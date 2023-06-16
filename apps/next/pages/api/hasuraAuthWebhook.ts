import { VercelRequest, VercelResponse } from '@vercel/node';

import { APP_NAME } from 'shared/config/auth';

import { defaultMainnetProvider } from 'services/utils/defaultProvider';
import { APITokenResult, isValidAuthToken } from 'services/utils/userHelpers';
import { verifyToken } from 'services/utils/web3JWT';

const unauthorizedVariables = {
  'X-Hasura-Role': 'public',
};

type EthTokenResult = { ethAddress: string };

async function validateHeaderToken(
  req: VercelRequest,
): Promise<EthTokenResult | APITokenResult | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  if (authHeader.substring(0, 6) !== 'Bearer')
    return isValidAuthToken(authHeader);

  const token = authHeader.replace('Bearer', '').trim();
  if (token.length === 0) return null;

  const claim = await verifyToken(token, defaultMainnetProvider, APP_NAME);
  if (!claim) {
    return null;
  }
  return { ethAddress: claim.iss };
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const tokenResult = await validateHeaderToken(req);

    if (!tokenResult || ('isValid' in tokenResult && !tokenResult.isValid)) {
      res.json(unauthorizedVariables);
      return;
    }
    if ('isValid' in tokenResult) {
      res.json({
        'X-Hasura-Role': 'api-user',
        'X-Hasura-Username': tokenResult.username,
      });
    } else {
      res.json({
        'X-Hasura-Role': 'user',
        'X-Hasura-Eth-Address': tokenResult.ethAddress,
      });
    }
  } catch (e) {
    res.status(500).send('Unable to authenticate');
  }
};
