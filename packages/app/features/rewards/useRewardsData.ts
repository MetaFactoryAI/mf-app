/* eslint-disable camelcase */
import dayjs from 'dayjs';
import { useState, useCallback } from 'react';
import { gql } from 'graphql-request';
// import fetchGraph from '@/utils/graph/fetchGraph';
// import { formatNumber } from '@/utils/presentationHelper';
// import { METAFACTORY_GQL_URL } from '@/utils/constants';

export type DesignerReward = {
  robot_reward: number;
  product: { id: string; title: string };
};
export type BuyerReward = {
  buyer_reward: number;
  date: string;
  order_number: string;
};
type DesignerRewards = { total: number; items: DesignerReward[] };
type BuyerRewards = { total: number; items: BuyerReward[] };

// const SUBGRAPH_ENDPOINTS: { [network: string]: string } = {
//   metafactory: METAFACTORY_GQL_URL,
// };

const useRewardsData = () => {
  const [designerRewards, setDesignerRewards] = useState<DesignerRewards>();
  const [buyerRewards, setBuyerRewards] = useState<BuyerRewards>();
  const [loadingDesigner, setLoadingDesigner] = useState(true);
  const [loadingBuyer, setLoadingBuyer] = useState(true);
  const [errors, setErrors] = useState({});

  const fetchDesignerRewards = (account: string, accountAuthToken: string) => {
    setLoadingDesigner(true);

    const DESIGNER_REWARDS_QUERY = gql`
      query DesignerRewards($account: String!) {
        robot_product_designer(where: { eth_address: { _eq: $account } }) {
          robot_reward
          product {
            title
            id
          }
        }
      }
    `;
    return null;
    // fetchGraph(
    //   SUBGRAPH_ENDPOINTS.metafactory,
    //   DESIGNER_REWARDS_QUERY,
    //   null,
    //   accountAuthToken,
    // )
    //   .then(({ data: { robot_product_designer } }) =>
    //     setDesignerRewards({
    //       total: calculateTotalDesignerRewards(robot_product_designer),
    //       items: normaliseRobotProductDesignerItems(robot_product_designer),
    //     }),
    //   )
    //   .catch((error) => setErrors({ error }))
    //   .finally(() => setLoadingDesigner(false))
  };

  const fetchBuyerRewards = (account: string, accountAuthToken: string) => {
    setLoadingBuyer(true);

    const BUYER_REWARDS_QUERY = gql`
      query BuyerRewards($account: String!) {
        robot_order(
          where: { buyer_address: { _eq: $account } }
          order_by: { date: desc }
        ) {
          buyer_reward
          date
          order_number
        }
      }
    `;
    return null;
    // return (
    //   fetchGraph(
    //     SUBGRAPH_ENDPOINTS.metafactory,
    //     BUYER_REWARDS_QUERY,
    //     null,
    //     accountAuthToken,
    //   )
    //     // @ts-ignore
    //     .then(({ data: { robot_order } }) =>
    //       setBuyerRewards({
    //         total: calculateTotalBuyerRewards(robot_order),
    //         items: normaliseRobotOrderItems(robot_order),
    //       }),
    //     )
    //     .catch((error) => setErrors(error))
    //     .finally(() => setLoadingBuyer(false))
    // );
  };

  return {
    designerRewards,
    buyerRewards,
    fetchDesignerRewards: useCallback(fetchDesignerRewards, []),
    fetchBuyerRewards: useCallback(fetchBuyerRewards, []),
    loading: loadingBuyer || loadingDesigner,
    errors,
  };
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
    amount: 0, // formatNumber(item.robot_reward),
  }));

const normaliseRobotOrderItems = (items: BuyerReward[]) =>
  items?.map((item) => ({
    ...item,
    date: dayjs(item.date, 'YYYY-MM-DD').format('MM/DD/YYYY'),
    amount: 0, // formatNumber(item.buyer_reward),
  }));

export default useRewardsData;
