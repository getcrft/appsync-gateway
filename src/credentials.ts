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

export function signRequest(request, credentials) {
  const signer = new (<any>AWS).Signers.V4(request, 'appsync', true);
  signer.addAuthorization(credentials, getAWSDate());
}

export class GlobalCredentialsStrategy implements CredentialsStrategy {
  async sign(httpRequest: AWS.HttpRequest) {
    return signRequest(httpRequest, AWS.config.credentials);
  }
}

export class IAMCredentialsStrategy implements CredentialsStrategy {
  private credentials: AWS.Credentials;

  constructor(
    key: string = null,
    accessKey: string = null,
    session: string = null,
    region: string = null
  ) {
    key = key || env.AWS_ACCESS_KEY_ID || '' ;
    accessKey = accessKey || env.AWS_SECRET_ACCESS_KEY || '';
    session = session || env.AWS_SESSION_TOKEN || '';
    region = session || env.AWS_REGION || env.REGION;

    this.credentials = new AWS.Credentials(
      key,
      accessKey,
      session
    );

    AWS.config.update({
      region,
      credentials: this.credentials
    });
  }

  async sign(httpRequest: AWS.HttpRequest) {
    return signRequest(httpRequest, this.credentials);
  }
}

export class AuthHeaderCredentialsStrategy implements CredentialsStrategy {
  constructor(private authHeader: string) {}

  async sign(httpRequest: AWS.HttpRequest) {
    httpRequest.headers['authorization'] = this.authHeader;
  }
}

export class APIKeyCredentialsStrategy implements CredentialsStrategy {
  constructor(private apiKey: string) {}

  async sign(httpRequest: AWS.HttpRequest) {
    httpRequest.headers['x-api-key'] = this.apiKey;
  }
}
