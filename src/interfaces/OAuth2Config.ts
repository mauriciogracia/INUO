export interface OAuth2Config {
  ssoType: 'OAuth2';
  clientId: string;
  authorizationEndpoint: string;
  scopes: string[];
}
