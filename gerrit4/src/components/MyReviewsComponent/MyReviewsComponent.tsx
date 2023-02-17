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
import { parseGerritJsonResponse, } from '@backstage/integration';

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


type DenseTableProps = {
  changes: Change[];
  tableTitle: string
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
    return trimmed.replaceAll('"', '');
  }, []);
  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return value || '';
};

export const DenseTable = ({ changes, tableTitle }: DenseTableProps) => {
  // useStyles() returns a style from Material UI 
  const classes = useStyles();
  // Define table column titles and mapping with row data
  const columns: TableColumn[] = [
    {
      title: 'Subject',
      field: 'subject',
      highlight: true,
      render: (row: any) => (
        <a
          href={`http://localhost:8080/c/${row.project}/+/${row._number}`}
          target="_blank"
          className={classes.link}
        >
          {row.subject}
        </a>
      ),
    },
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
    {
      title: 'Project',
      field: 'project',
      render: (row: any) => (
        <a
          href={`http://localhost:8080/plugins/gitiles/${row.project}`}
          target="_blank"
          className={classes.link}
        >
          {row.project}
        </a>
      )
    },
    {
      title: 'Branch',
      field: 'branch',
      render: (row: any) => (
        <a
          href={`http://localhost:8080/q/owner:${row.branch}`}
          target="_blank"
          className={classes.link}
        >
          {row.branch}
        </a>
      )
    },
    {
      title: 'Updated',
      field: 'updated',
      type: 'datetime'
    },
    {
      title: 'Status',
      field: 'status'
    },
    {
      title: 'Change Id',
      field: 'change_id'
    },
  ];
  //Map data to an array of Change type
  const data = changes.map(item => {
    return ({
      subject: item.subject,
      project: item.project,
      branch: item.branch,
      updated: item.updated.split('.')[0],
      owner: item.owner,
      status: item.status,
      change_id: item.change_id,
      _number: item._number,
    });
  });
  return (
    <Table
      title={tableTitle}
      options={{ search: false, paging: false, padding: 'dense' }}
      columns={columns}
      data={data}
    />
  );
};



const getDataAndApplyToTable = (getDatabase: string, tableTitle: string) => {
  const discoveryApi = useApi(discoveryApiRef);
  console.log(tableTitle)
  const proxyBackendBaseUrl = discoveryApi.getBaseUrl('proxy');
  const { value, loading, error } = useAsync(async (): Promise<Change[]> => {
    const response = await fetch(
      `${await proxyBackendBaseUrl}/gerrit/${getDatabase}`,
    );
    const data: any = { results: await parseGerritJsonResponse(response as any) };
    return data.results;
  }, []);
  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return <DenseTable changes={value || []} tableTitle={tableTitle} />;
};

const MyOpenGerritReviews = () => {
  const username = "user1"
  const request = `changes/?q=is:open+owner:${username}+limit:5&o=LABELS`
  const tableTitle: string = "Open Reviews"
  return getDataAndApplyToTable(request, tableTitle)
};

const MyInComingGerritReviews = () => {
  const username = "user1"
  const request = `changes/?q=is:open+reviewer:${username}+-owner:${username}+limit:5&o=LABELS`
  const tableTitle = "Incoming Reviews"
  return getDataAndApplyToTable(request, tableTitle)
};

const MyClosedGerritReviews = () => {
  const username = "user1"
  const request = `changes/?q=is:closed+owner:${username}+limit:5&o=LABELS`
  const tableTitle = "Closed Reviews"
  return getDataAndApplyToTable(request, tableTitle)
};

// const repoName = entity?.metadata?.name;
export const MyReviewsComponent = () => (
  <Page themeId="tool">
    <Header title="My Gerrit Review Dashboard!" subtitle="Optional subtitle">
      <HeaderLabel label="User" value="WHO AM I" />
    </Header>
    <Content>
      <ContentHeader title="My Gerrit Reviews">
        <SupportButton>Provides a link to gerrit changes.</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <MyOpenGerritReviews />
        </Grid>
        <Grid item>
          <MyInComingGerritReviews />
        </Grid>
        <Grid item>
          <MyClosedGerritReviews />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
