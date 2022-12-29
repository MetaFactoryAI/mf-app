import { SecondScreen } from 'app/features/home/SecondScreen';
import { useParam } from 'app/features/user/UserDetailScreen';
import { NavLayout } from '../../lib/NavLayout';
import { SolitoPage } from 'solito';

const Posts: SolitoPage = () => {
  const [user] = useParam('user');

  return (
    <>
      <SecondScreen title={`Posts by ${user}`} />
    </>
  );
};

Posts.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Posts;
