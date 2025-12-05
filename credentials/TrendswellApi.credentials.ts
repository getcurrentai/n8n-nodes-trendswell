import {
	ICredentialType,
	INodeProperties,
	IAuthenticate,
	ICredentialTestRequest,
	IHttpRequestMethods,
} from 'n8n-workflow';

// export const backendURL = 'http://localhost:5000';
export const backendURL = 'https://api.trendswell.ai';

export class TrendswellApi implements ICredentialType {
	name = 'trendswellApi';
	displayName = 'Trendswell API';
	documentationUrl = `${backendURL}/docs`; // optional

	properties: INodeProperties[] = [
		{
			displayName: 'Auth Token',
			name: 'authToken',
			type: 'string',
			default: '',
			required: true,
			typeOptions: { password: true },
		},
	];

	// Inject header: auth-token: <user token>
	authenticate: IAuthenticate = {
		type: 'generic',
		properties: {
			headers: {
				'auth-token': '={{$credentials.authToken}}',
			},
		},
	};

	// Test like Zapier: GET /user/me
	test: ICredentialTestRequest = {
		request: {
			method: 'GET' as IHttpRequestMethods,
			url: `${backendURL}/user/me`,
		},
	};
}
