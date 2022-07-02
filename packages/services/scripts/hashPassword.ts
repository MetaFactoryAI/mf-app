import bcrypt from 'bcrypt';

const SALT_ROUNDS = 5;

async function hashPassword() {
  const [password] = process.argv.slice(2);

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  // eslint-disable-next-line no-console
  console.log({ hash });
}

hashPassword();
