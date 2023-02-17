import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { Entity, ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';

/** @public */
export const isGerritRepo = (entity: Entity) => {
  return (
    Boolean(entity.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION]?.includes('localhost:8080')) ||
    Boolean(entity.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION]?.includes('gerrit')));
}

export const gerrit4Plugin = createPlugin({
  id: 'gerrit4',
  routes: {
    root: rootRouteRef,
  },
});

/** @public */
export const Gerrit4Page = gerrit4Plugin.provide(
  createRoutableExtension({
    name: 'Gerrit4Page',
    component: () =>
      import('./components/GerritComponent').then(m => m.GerritComponent),
    mountPoint: rootRouteRef,
  },
  ));
/** @public */
export const MyGerritReviews = gerrit4Plugin.provide(
  createRoutableExtension({
    name: 'MyGerritReviews',
    component: () =>
      import('./components/MyReviewsComponent').then(m => m.MyReviewsComponent),
    mountPoint: rootRouteRef,
  }),
);