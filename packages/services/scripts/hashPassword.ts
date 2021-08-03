import bcrypt from 'bcrypt';

const SALT_ROUNDS = 5;

async function hashPassword() {
  const [password] = process.argv.slice(2);

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  console.log({ hash });
}

hashPassword();
