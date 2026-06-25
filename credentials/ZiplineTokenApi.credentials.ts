import {
	IAuthenticateGeneric,
	Icon,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class ZiplineTokenApi implements ICredentialType {
	name = 'ziplineTokenApi';
	displayName = 'Zipline Token API';
	documentationUrl = 'https://zipline.diced.sh/docs/api/authentication';
	icon: Icon = 'file:ZiplineApi.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'userName',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Zipline Server URL',
			name: 'ziplineServerUrl',
			type: 'string',
			default: '',
			placeholder: 'e.g. https://zipline.yourdomain.com',
			required: true,
		},
		{
			displayName: 'Session Cookie',
			name: 'sessionCookie',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<{ sessionCookie: string }> {
		const { ziplineServerUrl, userName, password, totpCode } = credentials;

		const loginResponse = await this.helpers.httpRequest({
			method: 'POST',
			url: `${ziplineServerUrl}/api/auth/login`,
			body: {
				input: {
					username: userName,
					password: password,
					code: totpCode || undefined,
				},
			},
			json: true,
		});

		if (!loginResponse.sessionCookie) {
			throw new Error('Login failed: no sessionCookie returned.');
		}

		return {
			sessionCookie: loginResponse.sessionCookie,
		};
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.sessionCookie}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.vaultServerUrl}}/api/version',
			headers: {
				Authorization: '={{$credentials.sessionCookie}}',
			},
		},
	};
}
