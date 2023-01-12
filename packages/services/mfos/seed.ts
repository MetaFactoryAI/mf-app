import {
  Client,
  COLLABORATOR_ROLES,
  PRODUCT_STAGES,
  $,
  ValueTypes,
} from './index';
import {
  EXTENSION_DESCRIPTIONS,
  EXTENSION_MIME_TYPES,
  FileExtension,
} from '../utils/filesHelpers';
import { logger } from '../utils/logger';
import { fileFormatsSelector } from './files/selectors';

export async function seedStages(client: Client): Promise<void> {
  const stages = Object.values(PRODUCT_STAGES);
  const existingStages = await client('query')({
    stages: [{}, { name: true }],
  });
  const stagesToCreate: Array<ValueTypes['create_stages_input']> =
    stages.filter(
      (stage) => !existingStages.stages?.find((s) => s.name === stage.name),
    );

  if (!stagesToCreate.length) return;

  try {
    await client('mutation')(
      {
        create_stages_items: [
          { data: $('data', '[create_stages_input!]') },
          {
            name: true,
          },
        ],
      },
      {
        operationName: 'initStages',
        variables: {
          data: stagesToCreate,
        },
      },
    );
  } catch (e) {
    logger.warn('failed to seed stages', { error: e });
  }
}

export async function seedFileFormats(client: Client): Promise<void> {
  const fileFormats = Object.entries(EXTENSION_MIME_TYPES).map(
    ([name, mimeType]) => ({
      name: name.toUpperCase(),
      mime_type: mimeType,
      description: EXTENSION_DESCRIPTIONS[name as FileExtension],
      extension: name,
    }),
  );
  const existingFormats = await client('query')({
    file_formats: [{}, fileFormatsSelector],
  });

  const formatsToCreate: Array<ValueTypes['create_file_formats_input']> =
    fileFormats.filter(
      (format) =>
        !existingFormats.file_formats?.find(
          (f) => f.extension === format.extension,
        ),
    );
  if (!formatsToCreate.length) return;

  try {
    await client('mutation')(
      {
        create_file_formats_items: [
          { data: $('data', '[create_file_formats_input!]') },
          fileFormatsSelector,
        ],
      },
      {
        operationName: 'initFileFormats',
        variables: {
          data: formatsToCreate,
        },
      },
    );
  } catch (e) {
    logger.warn('failed to seed file formats', { error: e });
  }
}

export async function seedCollaboratorRoles(client: Client): Promise<void> {
  const roles = Object.values(COLLABORATOR_ROLES);
  const existingRoles = await client('query')({
    collaborator_roles: [{}, { name: true }],
  });
  const rolesToCreate: Array<ValueTypes['create_collaborator_roles_input']> =
    roles.filter(
      (role) =>
        !existingRoles.collaborator_roles?.find((s) => s.name === role.name),
    );

  if (!rolesToCreate.length) return;

  try {
    await client('mutation')(
      {
        create_collaborator_roles_items: [
          { data: $('data', '[create_collaborator_roles_input!]') },
          {
            name: true,
          },
        ],
      },
      {
        operationName: 'initCollaboratorRoles',
        variables: {
          data: rolesToCreate,
        },
      },
    );
  } catch (e) {
    logger.warn('failed to seed collaborator roles', { error: e });
  }
}
