import fs from 'fs';

import { useZeusVariables } from '../graphql/__generated__/zeus';
import { client } from '../graphql/client';

const CLAIMS = [
  {
    to: '0x8205d352E13Db52A124dB78329c35773Ef3A26E0',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['1', '16', '3', '18'],
        values: [1, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0xdf1e6c6163648ecf2fd1a04585337b358a4c450753cde9a51c34a33d275e055b',
    proof: [
      '0x9ac7e8fcb6a694b50b5b7dbe24db9c577933aff0fd24bbd6121a491bddda3457',
      '0xf200d01ea77b7e4c9808e8ba00ec873273826e18f4347712742a873839f04016',
      '0x6f79479acc9007ea54223036a8a1baaafc02a63c6f297dfb5d3f27b7e691076e',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x9C2A50BC7b72850d1E96AB0dEF312C369AA9ce19',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['9', '12', '13', '15', '17'],
        values: [1, 1, 2, 5, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0xca02b4572a7c74907b0f7afc58d7072734cf46a2f3c174f8c20141521b4670cf',
    proof: [
      '0xc802162d89f571145e11b8b906b6843d7843bba1548e4b57372cc02072c23980',
      '0x888bf1a3e71f6cf6636deb699869daabbcdde76029e29d26f003c4b89e170906',
      '0xe91b9153c6963ba289b658eb2dd8ee9143e76fca5045b84a7ae0efb2972ba14f',
      '0xe28d7dc7f22e5fcdac94501bd4e2e87b7cb8bd449759fe3acde61dc415d6d471',
    ],
  },
  {
    to: '0xfacef700458d4fc9746f7f3e0d37b462711ff09e',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['9', '12', '13', '15', '17'],
        values: [1, 1, 2, 5, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0x01982145ddb7bc47a4180b6409a344246061d77ce39ae4615f81f023e32ce0f3',
    proof: [
      '0x957c3dedb5ef05971e379ef44cb0a2e0e64a804b2769cb2391ed2ef7c30aaef7',
      '0x2f3546ec74af1531d3b3ae446a0051b543623d579bfad548f60f59dcf7904f9f',
      '0x3c33701226bb0a9a7141204fc2f99c85393277946d44b7ff754e07d6c4913f87',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0xE75304fE5bb590B6deA3CA13A8aBAb257c12E753',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['5', '7', '8', '9', '10', '11', '14'],
        values: [1, 1, 1, 1, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0x8eda1fc12e5da07c74d74d642a5fa0e7b87843c940a9cc4c7c5316e5e8a6002c',
    proof: [
      '0x0a8a6f6f1111f0477ab018c00c8a0105785e715f0f20ef20a0352a4280a4d4d1',
      '0xb451f059e7878adbba79d4cf5cc179087981be58dc96ec9fe820fe683bc4ad1d',
      '0x6f79479acc9007ea54223036a8a1baaafc02a63c6f297dfb5d3f27b7e691076e',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x8f942eced007bd3976927b7958b50df126feecb5',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['5', '7', '8', '9', '10', '11', '14'],
        values: [1, 1, 1, 1, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0xbdd6b1c2ba94c543d4b3669699957d77b773d4e97dac4abfa2dadfc5e7fd7ab7',
    proof: [
      '0x5adf1c57af9ff2ccccfa006a9b91f184553eb992c03fc1808526f2b436e91448',
      '0x0c65c27ace21252422518806f93d02f1111529718c6d3ddabaec64e973e5a970',
      '0x3c33701226bb0a9a7141204fc2f99c85393277946d44b7ff754e07d6c4913f87',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x58e2b4d76f66f2e71d1db865c4f4c8e9adcc13c0',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['2', '4', '6', '8'],
        values: [1, 1, 2, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0x00263dddb4e1a81e7f014473f94937fb019cbfb3e5bbffa968eef4a86a7144a9',
    proof: [
      '0x9a9fdacbed38bb2243bcc68b484cda07d4edf47d99a60ebf61d63aa916e2eee9',
      '0xf200d01ea77b7e4c9808e8ba00ec873273826e18f4347712742a873839f04016',
      '0x6f79479acc9007ea54223036a8a1baaafc02a63c6f297dfb5d3f27b7e691076e',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x30b4a5477314e3FbD0C22D6Afcd71EeCF4d9D22F',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['1', '3', '5', '7'],
        values: [1, 1, 2, 4],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0x86dede7c60eb4682378e1157c84754863aaf0d392b06c0b28a032545a73e6dad',
    proof: [
      '0x135f3976d18d4ca6d07d4677d340bcaffdc5bbb217f9a258534080820f671ab6',
      '0xb451f059e7878adbba79d4cf5cc179087981be58dc96ec9fe820fe683bc4ad1d',
      '0x6f79479acc9007ea54223036a8a1baaafc02a63c6f297dfb5d3f27b7e691076e',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x670a6eb62f5146d4b3b40c7b58aa31d175e3d6fb',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['2', '4', '6', '8'],
        values: [2, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0xad0cf742f54303368cc15564efc6a95c07df75b80d8575bbe6f687321cd9758c',
    proof: [
      '0x9369e6426d82f4613e226283595f2c2aebf383b03f85c88ba9eaf8717daa3ec1',
      '0x2f3546ec74af1531d3b3ae446a0051b543623d579bfad548f60f59dcf7904f9f',
      '0x3c33701226bb0a9a7141204fc2f99c85393277946d44b7ff754e07d6c4913f87',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x9bcdc7db2f57b0f960a737ccc29373a9bc760134',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['1', '5', '9', '13'],
        values: [1, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0xebcff4ad2a677320fa0d8566b2977f608a35a8bfd363cfe83d22c8c0ba6fdd36',
    proof: [
      '0xc134702151fa0e2d58a71abf889a2f551263b0a04d2d3318635f396cfb65879f',
      '0x888bf1a3e71f6cf6636deb699869daabbcdde76029e29d26f003c4b89e170906',
      '0xe91b9153c6963ba289b658eb2dd8ee9143e76fca5045b84a7ae0efb2972ba14f',
      '0xe28d7dc7f22e5fcdac94501bd4e2e87b7cb8bd449759fe3acde61dc415d6d471',
    ],
  },
  {
    to: '0xf8049c8425f9eab4e2ae9e1d950f9d3f71481882',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['1', '2', '3', '4'],
        values: [1, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0xf1a4555de599592b48f0aabe7f8cebe47d55ba3f920d9b768ac040148929a03a',
    proof: [
      '0x1bcf2b13da0c76e70c3d719e42a7ee77b87fd7dc73cb3617948936abb9fa63a9',
      '0x0c65c27ace21252422518806f93d02f1111529718c6d3ddabaec64e973e5a970',
      '0x3c33701226bb0a9a7141204fc2f99c85393277946d44b7ff754e07d6c4913f87',
      '0x00ae74acb2e6d7db162b9f4f3e742afe2b274b11e8412f03a384d8da6724c17e',
    ],
  },
  {
    to: '0x4cca9821c246acd39a42f34e6ae4e520a8224565',
    erc1155: [
      {
        contractAddress: '0xf9a28b227bDaC129eB85Ca3F27F55d1dD9ecFD94',
        ids: ['2', '6', '10', '14', '19', '20', '21'],
        values: [1, 1, 1, 1, 1, 1, 1],
      },
    ],
    erc721: [],
    erc20: { contractAddresses: [], amounts: [] },
    salt: '0x7ba9f6d90d977ef556c500aafffcb6dfb410b5762f4507dd96b0885576274705',
    proof: [
      '0xdd38d42be5fe5231c4212355d869f4988fc7113fcfef008b7c38eeae93cf689b',
      '0x5bce1f2d7d7f302c0cb0932c17dd409a60fc3a9672a2ed6168ea40b30827ac28',
      '0xe91b9153c6963ba289b658eb2dd8ee9143e76fca5045b84a7ae0efb2972ba14f',
      '0xe28d7dc7f22e5fcdac94501bd4e2e87b7cb8bd449759fe3acde61dc415d6d471',
    ],
  },
];

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
  }));
  const variables = useZeusVariables({
    data: '[robot_merkle_claims_insert_input!]!',
  })({
    data: merkleClaims,
  });
  const { $ } = variables;
  try {
    const insertMerkleRootRes = await client.mutate(
      {
        insert_robot_merkle_roots_one: [
          {
            object: {
              contract_address: contractAddress,
              hash,
              network,
              merkle_claims: { data: $('data') },
            },
          },
          {
            created_at: true,
          },
        ],
      },
      {
        operationName: 'insertMerkleRootWithClaims',
        variables,
      },
    );
    console.log(insertMerkleRootRes.insert_robot_merkle_roots_one);
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
}

insertMerkleClaims();
