import { PRODUCT_STAGES, StageName } from 'services/mfos';
import { ProductFiles } from 'services/mfos/products/selectors';

export type ProductTag = {
  name: string;
  // color: string;
  // Tailwind classNames
  className: string;
  progressValue: number;
};

export const getProductTags = (product: ProductFiles): ProductTag[] => {
  const {
    clo3d_file,
    content,
    design_files,
    wearable_files,
    // description,
    images,
  } = product;

  const tags = [
    clo3d_file && {
      name: 'Clo3D',
      className: 'border text-gray-12',
      progressValue: 0.1,
    },
    content?.length && {
      name: 'Content',
      className: 'border text-gray-12',
      progressValue: 0.1,
    },
    images?.length && {
      name: 'Renders',
      className: 'border text-gray-12',
      progressValue: 0.1,
    },
    design_files?.length && {
      name: 'Design',
      className: 'border text-gray-12',
      progressValue: 0.2,
    },
    wearable_files?.length && {
      name: 'Wearable',
      className: 'border text-gray-12',
      progressValue: 0.1,
    },
  ].filter((tag) => {
    return !!tag;
  });

  return tags as ProductTag[];
};

export const getProgressFromTagsAndStage = (
  tags: ProductTag[],
  stage: string | undefined,
) => {
  const tagProgress = tags.reduce((acc, tag) => {
    return acc + tag.progressValue;
  }, 0);

  const stageProgress =
    stage && PRODUCT_STAGES[stage as StageName]
      ? PRODUCT_STAGES[stage as StageName].progress
      : 0;

  return tagProgress + stageProgress;
};
