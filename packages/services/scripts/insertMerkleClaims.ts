/* eslint-disable no-console */
import fs from 'fs';

import { $, ValueTypes } from '../graphql/__generated__/zeus';
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
  const merkleClaims: Array<ValueTypes['robot_merkle_claims_insert_input']> =
    claims.map((c) => ({
      recipient_eth_address: c.to,
      claim_json: c,
    }));

  try {
    const insertMerkleRootRes = await hasuraClient.mutate(
      {
        insert_robot_merkle_roots_one: [
          {
            object: {
              contract_address: contractAddress,
              hash,
              network,
              merkle_claims: {
                data: $('data', '[robot_merkle_claims_insert_input!]!'),
              },
            },
          },
          {
            created_at: true,
          },
        ],
      },
      {
        operationName: 'insertMerkleRootWithClaims',
        variables: {
          data: merkleClaims,
        },
      },
    );
    console.log(insertMerkleRootRes.insert_robot_merkle_roots_one);
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
}

insertMerkleClaims();
