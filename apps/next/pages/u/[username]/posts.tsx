import type { SolitoPage } from 'solito';

import { SecondScreen } from 'app/features/home/SecondScreen';
import { useParam } from 'app/features/user/UserDetailScreen';

import { NavLayout } from '~/lib/NavLayout';

const Posts: SolitoPage = () => {
  const [username] = useParam('username');

  return (
    <>
      <SecondScreen title={`Posts by ${username}`} />
    </>
  );
};

Posts.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Posts;
