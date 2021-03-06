import {
  Client,
  COLLABORATOR_ROLES,
  PRODUCT_STAGES,
  useZeusVariables,
} from '../mfos';
import {
  EXTENSION_DESCRIPTIONS,
  EXTENSION_MIME_TYPES,
  FileExtension,
} from '../utils/filesHelpers';
import { logger } from '../utils/logger';
import { fileFormatsSelector } from './selectors';

export async function seedStages(client: Client): Promise<void> {
  const stages = Object.values(PRODUCT_STAGES);
  const existingStages = await client('query')({
    stages: [{}, { name: true }],
  });
  const stagesToCreate = stages.filter(
    (stage) => !existingStages.stages?.find((s) => s.name === stage.name),
  );

  if (!stagesToCreate.length) return;

  const variables = useZeusVariables({
    data: '[create_stages_input!]',
  })({
    data: stagesToCreate,
  });
  const { $ } = variables;

  try {
    await client('mutation')(
      {
        create_stages_items: [
          { data: $('data') },
          {
            name: true,
          },
        ],
      },
      {
        operationName: 'initStages',
        variables,
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

  const formatsToCreate = fileFormats.filter(
    (format) =>
      !existingFormats.file_formats?.find(
        (f) => f.extension === format.extension,
      ),
  );
  if (!formatsToCreate.length) return;

  const variables = useZeusVariables({
    data: '[create_file_formats_input!]',
  })({
    data: formatsToCreate,
  });
  const { $ } = variables;

  try {
    await client('mutation')(
      {
        create_file_formats_items: [{ data: $('data') }, fileFormatsSelector],
      },
      {
        operationName: 'initFileFormats',
        variables,
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
  const rolesToCreate = roles.filter(
    (role) =>
      !existingRoles.collaborator_roles?.find((s) => s.name === role.name),
  );

  if (!rolesToCreate.length) return;

  const variables = useZeusVariables({
    data: '[create_collaborator_roles_input!]',
  })({
    data: rolesToCreate,
  });

  try {
    await client('mutation')(
      {
        create_collaborator_roles_items: [
          { data: variables.$('data') },
          {
            name: true,
          },
        ],
      },
      {
        operationName: 'initCollaboratorRoles',
        variables,
      },
    );
  } catch (e) {
    logger.warn('failed to seed collaborator roles', { error: e });
  }
}
