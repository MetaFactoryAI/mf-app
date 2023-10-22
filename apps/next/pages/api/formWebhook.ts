import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Handle form submission
  const { body } = req;
  console.log(body);
  res.status(200).send('OK');
};
