import {
  act,
  renderHook,
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks';
import {
  render,
  RenderAPI,
  RenderOptions,
} from '@testing-library/react-native';
import React from 'react';

import { MockProvider } from './mockProvider';

const customRender = (
  ui: React.ReactElement<unknown>,
  options?: RenderOptions,
): RenderAPI =>
  render(ui, {
    wrapper: MockProvider,
    ...options,
  });

const customRenderHook = <P, R>(
  callback: (props: P) => R,
  options?: RenderHookOptions<P>,
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: MockProvider,
    ...options,
  });

export * from '@testing-library/react-native';

export { act, customRender as render, customRenderHook as renderHook };
