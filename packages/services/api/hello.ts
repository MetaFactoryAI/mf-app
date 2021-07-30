import { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse): void => {
  const { name = 'World' } = req.query;

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  res.status(200).send(`Hello ${name}!`);
};
