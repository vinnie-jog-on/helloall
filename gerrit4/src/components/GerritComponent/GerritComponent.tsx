/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
  Progress,
  TableColumn,
  Table,
} from '@backstage/core-components';
import { discoveryApiRef, useApi } from '@backstage/core-plugin-api';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import useAsync from 'react-use/lib/useAsync';
import { useEntity } from '@backstage/plugin-catalog-react';
import { parseGerritJsonResponse } from '@backstage/integration';

const useStyles = makeStyles({
  link: {
    textDecoration: 'underline',
    fontSize: '16px',
    lineHeight: '27px',
    color: 'blue',
    '&:hover, &:focus': {
      fontWeight: '500',
    },
  },
});

type Change = {
  subject: string;
  owner: { _account_id: string };
  project: string;
  branch: string;
  updated: string;
  status: string;
  change_id: string;
  _number: string;
};

// type DagTableRow = {
//   id: string;
//   dagUrl: string;
//   row: string;
// };

type DenseTableProps = {
  changes: Change[];
};

const useGetGerritUser = (userid: string) => {
  const discoveryApi = useApi(discoveryApiRef);
  const proxyBackendBaseUrl = discoveryApi.getBaseUrl('proxy');
  const { value, loading, error } = useAsync(async () => {
    const response = await fetch(
      `${await proxyBackendBaseUrl}/gerrit/accounts/${userid}/username`,
    );
    const data = await response.text();
    const trimmed = data.substring(4);
    // console.log(trimmed.replaceAll('"', ''))
    return trimmed.replaceAll('"', '');
  }, []);
  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return value || '';
};

export const DenseTable = ({ changes }: DenseTableProps) => {
  const classes = useStyles();
  const columns: TableColumn[] = [

    { title: 'Subject', field: 'subject' },
    {
      title: 'Owner',
      field: 'owner._account_id',
      render: (row: any) => (
        <a
          href={`http://localhost:8080/q/owner:${row.owner._account_id}`}
          target="_blank"
          className={classes.link}
        >
          {useGetGerritUser(row.owner._account_id as string)}
        </a>
      ),
    },
    { title: 'Project', field: 'project' },
    { title: 'Branch', field: 'branch' },
    { title: 'Updated', field: 'updated' },
    { title: 'Status', field: 'status' },
    { title: 'Change Id', field: 'change_id' },
  ];

  const data = changes.map(change => {

    return {
      subject: (
        <a
          href={`http://localhost:8080/c/${change.project}/+/${change._number}`}
          target="_blank"
          className={classes.link}
        >
          {change.subject}
        </a>
      ),
      project: change.project,
      branch: (
        <a
          href={`http://localhost:8080/plugins/gitiles/${change.project}/+/refs/heads/${change.branch}`}
          target="_blank"
          className={classes.link}
        >
          {change.branch}
        </a>
      ),
      updated: change.updated.split('.')[0],
      owner: change.owner,
      status: change.status,
      change_id: change.change_id,
    };
  });

  return (
    <Table
      title="Gerrit reviews on repo"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

const GerritProxyComponent = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const proxyBackendBaseUrl = discoveryApi.getBaseUrl('proxy');
  const { entity } = useEntity();
  // const repoName = entity?.metadata?.name;
  const { value, loading, error } = useAsync(async (): Promise<Change[]> => {
    const response = await fetch(
      `${await proxyBackendBaseUrl}/gerrit/changes/?q=project:${entity?.metadata?.name
      }`,
    );
    const data: any = { results: await parseGerritJsonResponse(response as any) };
    return data.results;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return <DenseTable changes={value || []} />;
};

const MyHeaderLabel = () => {
  const { entity } = useEntity();
  return (
    <Header title="Gerrit Page!" subtitle="Optional subtitle">
      <HeaderLabel label="Repo Name" value={entity?.metadata?.name} />
      <HeaderLabel label="Lifecycle" value={entity?.spec?.lifecycle} />
    </Header>
  )
}
export const GerritComponent = () => (
  <Page themeId="tool">
    <MyHeaderLabel />
    <Content>
      <ContentHeader title="Gerrit portal">
        <SupportButton>Provides a link to gerrit changes.</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <GerritProxyComponent />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
