/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Shamelessly adapted from OpenZeppelin-contracts test utils
import { keccak256, keccakFromString, bufferToHex } from 'ethereumjs-util';
import { hexToBytes, toWei, soliditySha3 } from 'web3-utils';
// import type { ClaimWeek } from '../claims';

// Merkle tree called with 32 byte hex values
export class MerkleTree {
  elements: Buffer[];

  layers: any[];

  constructor(elements: string[]) {
    this.elements = elements
      .filter((el) => el)
      .map((el) => Buffer.from(hexToBytes(el)));

    // Sort elements
    this.elements.sort(Buffer.compare);
    // Deduplicate elements
    this.elements = this.bufDedup(this.elements);

    // Create layers
    this.layers = this.getLayers(this.elements);
  }

  getLayers(elements: Buffer[]) {
    if (elements.length === 0) {
      return [['']];
    }

    const layers: any[][] = [];
    layers.push(elements);

    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]));
    }

    return layers;
  }

  getNextLayer(elements: Buffer[]) {
    return elements.reduce((layer: any, el: any, idx: number, arr: any[]) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(this.combinedHash(el, arr[idx + 1]));
      }

      return layer;
    }, []);
  }

  combinedHash(first: string, second: string): Buffer | string {
    if (!first) {
      return second;
    }
    if (!second) {
      return first;
    }

    return keccak256(this.sortAndConcat(first, second));
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0];
  }

  getHexRoot() {
    return bufferToHex(this.getRoot());
  }

  getProof(el: Buffer) {
    let idx = this.bufIndexOf(el, this.elements);

    if (idx === -1) {
      throw new Error('Element does not exist in Merkle tree');
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = this.getPairElement(idx, layer);

      if (pairElement) {
        proof.push(pairElement);
      }

      idx = Math.floor(idx / 2);

      return proof;
    }, []);
  }

  // external call - convert to buffer
  getHexProof(_el: any) {
    const el = Buffer.from(hexToBytes(_el));

    const proof = this.getProof(el);

    return this.bufArrToHexArr(proof);
  }

  getPairElement(idx: number, layer: any) {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (pairIdx < layer.length) {
      return layer[pairIdx];
    }
    return null;
  }

  bufIndexOf(el: Buffer | string, arr: Buffer[]) {
    let hash;

    // Convert element to 32 byte hash if it is not one already
    if (el.length !== 32 || !Buffer.isBuffer(el)) {
      hash = keccakFromString(el as string);
    } else {
      hash = el as Buffer;
    }

    for (let i = 0; i < arr.length; i++) {
      if (hash.equals(arr[i])) {
        return i;
      }
    }

    return -1;
  }

  bufDedup(elements: Buffer[]) {
    return elements.filter(
      (el, idx: number) => idx === 0 || !elements[idx - 1].equals(el),
    );
  }

  bufArrToHexArr(arr: Buffer[]) {
    if (arr.some((el) => !Buffer.isBuffer(el))) {
      throw new Error('Array is not an array of buffers');
    }

    return arr.map((el: Buffer) => `0x${el.toString('hex')}`);
  }

  sortAndConcat(...args: any[]) {
    return Buffer.concat([...args].sort(Buffer.compare));
  }
}

export function loadTree(balances: any) {
  const elements = Object.keys(balances).map((address) => {
    const balance = toWei(balances[address].toString());

    return soliditySha3(address, balance) as string;
  });
  return new MerkleTree(elements);
}
