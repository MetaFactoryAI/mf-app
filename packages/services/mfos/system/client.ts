import { createSystemClient } from '../__generated__/client';
import {
  MFOS_GRAPHQL_TOKEN,
  MFOS_SYSTEM_GRAPHQL_URL,
} from 'shared/config/secret';

export const mfosSystemClient = createSystemClient(
  MFOS_SYSTEM_GRAPHQL_URL,
  MFOS_GRAPHQL_TOKEN,
);
