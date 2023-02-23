/* eslint-disable camelcase */
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { hasuraClient } from 'services/graphql/client';
import { order_by } from 'services/graphql/__generated__/zeus';

import { formatNumber } from './utils/format';

export type DesignerReward = {
  robot_reward: number;
  product: { id: string; title: string };
};
export type BuyerReward = {
  buyer_reward: number;
  date: string;
  order_number: string;
};

const useContributorRewards = ({ address }: { address: string }) => {
  const { data, isLoading, error } = useQuery(
    ['contributorRewards', address],
    async () => {
      const data = await hasuraClient.query({
        robot_product_designer: [
          {
            where: { eth_address: { _eq: address } },
          },
          {
            robot_reward: true,
            product: {
              title: true,
              id: true,
            },
          },
        ],
        robot_order: [
          {
            where: { buyer_address: { _eq: address } },
            order_by: [{ date: order_by.asc }],
          },
          {
            buyer_reward: true,
            date: true,
            order_number: true,
          },
        ],
      });

      return {
        buyer: {
          total: calculateTotalBuyerRewards(data.robot_order as BuyerReward[]),
          items: normaliseRobotOrderItems(data.robot_order as BuyerReward[]),
        },
        designer: {
          total: calculateTotalDesignerRewards(
            data.robot_product_designer as DesignerReward[],
          ),
          items: normaliseRobotProductDesignerItems(
            data.robot_product_designer as DesignerReward[],
          ),
        },
      };
    },
  );

  return { data, isLoading, error };
};

const calculateTotalDesignerRewards = (rewards: DesignerReward[]) =>
  rewards?.reduce(
    (sum: number, reward: { robot_reward: number }) =>
      sum + reward.robot_reward,
    0,
  );

const calculateTotalBuyerRewards = (rewards: BuyerReward[]) =>
  rewards?.reduce(
    (sum: number, reward: { buyer_reward: number }) =>
      sum + reward.buyer_reward,
    0,
  );

const normaliseRobotProductDesignerItems = (items: DesignerReward[]) =>
  items?.map((item) => ({
    ...item,
    product_title: item.product.title,
    product_id: item.product.id,
    amount: formatNumber(item.robot_reward),
  }));

const normaliseRobotOrderItems = (items: BuyerReward[]) =>
  items?.map((item) => ({
    ...item,
    date: dayjs(item.date, 'YYYY-MM-DD').format('MM/DD/YYYY'),
    amount: formatNumber(item.buyer_reward),
  }));

export default useContributorRewards;
