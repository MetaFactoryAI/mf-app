import { gql } from 'graphql-request';
import shortid from 'shortid';

import { client } from '../utils/hasuraClient';

const NUM_CODES = 250;

const INSERT_CODES_MUTATION = gql`
  mutation InsertAccessCodes($locks: [shop_product_locks_insert_input!]!) {
    locks: insert_shop_product_locks(objects: $locks) {
      affected_rows
      returning {
        access_code
      }
    }
  }
`;

type LockInput = {
  access_code: string;
  lock_id: string;
};

type InsertCodesResponse = {
  locks: {
    affected_rows: number;
    returning: Array<{ access_code: string }>;
  };
};

// yarn ts-node ./scripts/insertAccessCodes <lockId>
async function insertAccessCodes() {
  const [lockId] = process.argv.slice(2);

  if (!lockId) throw new Error('Must provide lockId');

  const locks: LockInput[] = [];

  for (let i = 0; i < NUM_CODES; i += 1) {
    locks.push({ access_code: shortid.generate(), lock_id: lockId });
  }

  const claimedLockData = await client.request<InsertCodesResponse>(
    INSERT_CODES_MUTATION,
    {
      locks,
    },
  );

  console.log(
    claimedLockData.locks.returning.map((l) => l.access_code).join('\n'),
  );

  console.log(`Created ${claimedLockData.locks.affected_rows} locks`);
}

insertAccessCodes();
