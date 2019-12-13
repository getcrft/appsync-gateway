import { env } from 'process';
import fetch from 'node-fetch';
import URL from 'url';
import AWS from 'aws-sdk';
import { CredentialsStrategy } from './credentials';

type GraphQLBody<TInput = any> = {
  operationName: string;
  query: string;
  variables: TInput;
};

type GraphQLResult<T> = {
  data?: T;
  errors?: any[];
};

type GraphQLOptions = {
  ignoreErrors?: boolean;
};

export class GraphQLGateway {
  private uri: URL.UrlWithStringQuery;
  private region: string;

  constructor(
    private credentialsStrategy: CredentialsStrategy,
    url: string = null,
    region: string = null
  ) {
    url = url || env.API_API_GRAPHQLAPIENDPOINTOUTPUT;
    this.uri = URL.parse(url);
    this.region = region || env.REGION;
  }

  async runQuery<TResult, TInput>(body: GraphQLBody, options: GraphQLOptions= { ignoreErrors: false }) {
    let result: GraphQLResult<TResult>;

    try {
      const uri = this.uri;

      // Reference: https://aws-amplify.github.io/docs/cli-toolchain/quickstart#graphql-from-lambda
      const endpoint = new AWS.Endpoint(uri.href);
      const httpRequest = new AWS.HttpRequest(endpoint, this.region);

      httpRequest.headers.host = uri.host;
      httpRequest.headers['Content-Type'] = 'application/json';
      httpRequest.method = 'POST';
      httpRequest.body = JSON.stringify(body);

      await this.credentialsStrategy.sign(httpRequest);

      const res = await fetch(uri.href, {
        method: httpRequest.method,
        body: httpRequest.body,
        headers: httpRequest.headers
      });

      result = await res.json();
    } catch (err) {
      throw err;
    }

    if (!options.ignoreErrors && result.errors && result.errors.length) {
      throw new Error(
        `GraphQL Errors[${body.operationName}]: ${JSON.stringify(
          result.errors
        )}`
      );
    }

    return result.data;
  }
}
