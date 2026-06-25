import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['version'],
			},
		},
		options: [
			{
				name: 'Get Version',
				value: 'getVersion',
				action: 'Get stats',
				description: 'Returns version details of the backend, including current version, release status, and upstream/latest version information',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/version',
						headers: {
							Cookie: '{{$credentials.accessToken}}',
						},
					},
				},
			},
		],
		default: 'getVersion',
	},
];

export const parameters: INodeProperties[] = [

];
