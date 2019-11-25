import { env } from 'process';
import fetch from 'node-fetch';
import URL from 'url';
import AWS from 'aws-sdk';
import { CredentialsStrategy } from './credentials';

type GraphQLBody = {
  operationName: string;
  query: string;
  variables: {
    [key: string]: any;
  };
};

export class GraphQLGateway {
  private uri: URL.UrlWithStringQuery;

  constructor(
    private credentialsStrategy: CredentialsStrategy,
    url: string = null
  ) {
    url = url || env.API_API_GRAPHQLAPIENDPOINTOUTPUT;
    this.uri = URL.parse(url);
  }

  async runQuery(body: GraphQLBody) {
    try {
      const uri = this.uri;

      // Reference: https://aws-amplify.github.io/docs/cli-toolchain/quickstart#graphql-from-lambda
      const endpoint = new AWS.Endpoint(uri.href);
      const httpRequest = new AWS.HttpRequest(endpoint, env.AWS_REGION);

      httpRequest.headers.host = uri.host;
      httpRequest.headers['Content-Type'] = 'application/json';
      httpRequest.method = 'POST';
      httpRequest.body = JSON.stringify(body);
      // httpRequest.headers['authorization'] = process.env.AUTH_TOKEN;

      console.info('Posting:', httpRequest.body);

      await this.credentialsStrategy.sign(httpRequest);

      const res = await fetch(uri.href, {
        method: httpRequest.method,
        body: httpRequest.body,
        headers: httpRequest.headers
      });

      const json = await res.json();
      console.info('Response:', JSON.stringify(json, null, 2));

      return json.data;
    } catch (err) {
      console.error('GraphQL Error:', JSON.stringify(err, null, 2));
      throw err;
    }
  }
}
