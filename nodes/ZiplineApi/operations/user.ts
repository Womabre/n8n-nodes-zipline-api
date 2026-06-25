import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Get User By ID',
				value: 'getUserById',
				action: 'Get user by ID',
				description: 'Get a specific user by their ID, and make changes to their user',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/users',
						// url: '=/api/users/{{$parameter["userId"]}}',
						headers: {
							Cookie: '{{$credentials.accessToken}}',
						},
					},
				},
			},
		],
		default: 'getUserById',
	},
];

export const parameters: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'options',
		description: 'The ID of the user to retrieve',
		typeOptions: {
			loadOptions: {
				routing: {
					request: {
						method: 'GET',
						url: '=/api/users',
					},
					output: {
						postReceive: [
							// {
							// 	type: 'rootProperty',
							// 	properties: {
							// 		property: 'body',
							// 	},
							// },
							{
								type: 'setKeyValue',
								properties: {
									name: '={{ $responseItem.id }}',
									value: '={{ $responseItem.id }}',
									// name: "={{ $responseItem.username + ' (Id: ' + $responseItem.id + ')' }}",
									// value: '={{ $responseItem.id }}',
								},
							},
							{
								type: 'sort',
								properties: { key: 'name' },
							},
						],
					},
				},
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-required-false
		required: false,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['getUserById'],
			},
		},
		default: '',
	},
];
