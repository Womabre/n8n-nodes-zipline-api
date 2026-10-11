import {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZiplineTokenApi implements ICredentialType {
	name = 'ziplineTokenApi';
	displayName = 'Zipline Token API';
	documentationUrl = 'https://zipline.diced.sh/docs/api/authentication';
	icon: Icon = { light: 'file:ZiplineApi.svg', dark: 'file:ZiplineApi.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Zipline Server URL',
			name: 'ziplineServerUrl',
			type: 'string',
			default: '',
			placeholder: 'e.g. https://zipline.yourdomain.com',
			required: true,
		},
		{
			displayName: 'Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Zipline API token. Find it in the dashboard under your avatar → "Copy token", or in user settings.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.ziplineServerUrl.replace(/\\/+$/, "")}}/api/user',
		},
	};
}
