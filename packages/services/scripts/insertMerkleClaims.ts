/* eslint-disable no-console */
import fs from 'fs';

import {
  robot_merkle_roots_constraint,
  robot_merkle_roots_update_column,
  useZeusVariables,
} from '../graphql/__generated__/zeus';
import { hasuraClient } from '../graphql/client';

type Claim = {
  to: string;
  erc1155: Record<string, unknown>[];
  erc721: Record<string, unknown>[];
  salt: string;
  proof: string[];
};

// yarn ts-node ./scripts/insertAccessCodes <lockId>
async function insertMerkleClaims() {
  const [network, contractAddress, hash, claimsJsonFile] =
    process.argv.slice(2);
  const rawClaims = fs.readFileSync(claimsJsonFile, { encoding: 'utf8' });
  const claims = JSON.parse(rawClaims) as Claim[];
  const merkleClaims = claims.map((c) => ({
    recipient_eth_address: c.to,
    claim_json: c,
    merkle_root_hash: hash,
  }));
  const variables = useZeusVariables({
    data: '[robot_merkle_claims_insert_input!]!',
  })({
    data: merkleClaims,
  });
  console.log(
    `Inserting claims on ${network} to contract at ${contractAddress}`,
  );

  const { $ } = variables;
  try {
    const insertMerkleRootRes = await hasuraClient.mutate(
      {
        insert_robot_merkle_claims: [
          {
            objects: $('data'),
          },
          {
            affected_rows: true,
          },
        ],
      },
      {
        operationName: 'insertMerkleClaims',
        variables,
      },
    );
    console.log(
      `Inserted ${
        insertMerkleRootRes?.insert_robot_merkle_claims?.affected_rows || 0
      } claims`,
    );
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
}

insertMerkleClaims();
