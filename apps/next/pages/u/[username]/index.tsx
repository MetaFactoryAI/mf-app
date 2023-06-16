import type { SolitoPage } from 'solito';

import { UserDetailScreen } from 'app/features/user/UserDetailScreen';

import { NavLayout } from '~/lib/NavLayout';

const UserDetail: SolitoPage = () => <UserDetailScreen />;

UserDetail.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default UserDetail;
