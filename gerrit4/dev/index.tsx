import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { gerrit4Plugin, MyGerritReviews } from '../src/plugin';

createDevApp()
  .registerPlugin(gerrit4Plugin)
  .addPage({
    element: <MyGerritReviews />,
    title: 'Root Page',
    path: '/gerrit4'
  })
  .render();
