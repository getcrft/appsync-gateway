# Appsync API Gateway

Utility method for making API calls to AppSync from Lambdas in AWS.

## Usage

```ts
const {
  GraphQLGateway,
  IAMCredentialsStrategy
} = require('@crft/appsync-gateway');

const creds = new IAMCredentialsStrategy();
const gateway = new GraphQLGateway(
  creds,
  process.env.API_API_GRAPHQLAPIENDPOINTOUTPUT
);
```

## Commands
- `npm build` - Run the typescript build