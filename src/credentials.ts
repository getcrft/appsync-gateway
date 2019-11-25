import { env } from 'process';
import AWS from 'aws-sdk';

export interface CredentialsStrategy {
  sign(httpRequest: AWS.HttpRequest): Promise<void>;
}

export function getAWSDate() {
  if (AWS.config.systemClockOffset) {
    // use offset when non-zero
    return new Date(new Date().getTime() + AWS.config.systemClockOffset);
  } else {
    return new Date();
  }
}

export class IAMCredentialsStrategy implements CredentialsStrategy {
  private credentials: AWS.Credentials;

  constructor() {
    console.log('IAM signer');

    this.credentials = new AWS.Credentials(
      env.AWS_ACCESS_KEY_ID,
      env.AWS_SECRET_ACCESS_KEY,
      env.AWS_SESSION_TOKEN
    );

    // Authenticate as lambda - needed?
    AWS.config.update({
      region: env.AWS_REGION,
      credentials: this.credentials
    });
  }

  async sign(httpRequest: AWS.HttpRequest) {
    const creds = this.credentials;
    const signer = new (<any>AWS).Signers.V4(httpRequest, 'appsync', true);
    signer.addAuthorization(creds, getAWSDate());
  }
}

export class AuthHeaderCredentialsStrategy implements CredentialsStrategy {
  constructor(private authHeader: string) {}

  async sign(httpRequest: AWS.HttpRequest) {
    httpRequest.headers['authorization'] = this.authHeader;
  }
}
