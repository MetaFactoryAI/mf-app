import { VercelRequest, VercelResponse } from '@vercel/node';

import { isValidAuthToken } from '../utils/userHelpers';

const unauthorizedVariables = {
  'X-Hasura-Role': 'public',
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { isValid, username } = await isValidAuthToken(
      req.headers.authorization,
    );

    if (!isValid) {
      res.json(unauthorizedVariables);
      return;
    }

    res.json({
      'X-Hasura-Role': 'api-user',
      'X-Hasura-Username': username,
    });
  } catch (e) {
    res.status(500).send('Unable to authenticate');
  }
};
