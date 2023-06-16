import type { SolitoPage } from 'solito';

import { RewardsClaimScreen } from 'app/features/rewards/RewardsClaim';

import { NavLayout } from '~/lib/NavLayout';

const Rewards: SolitoPage = () => <RewardsClaimScreen />;

Rewards.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Rewards;
