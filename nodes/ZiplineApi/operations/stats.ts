import { IDataObject, INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stats'],
			},
		},
		options: [
			{
				name: 'Get Stats',
				value: 'getStats',
				action: 'Get stats',
				description: 'Get metrics and statistics of the current Zipline instance',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/stats',
						qs: '={{ $parameter["statsAll"] ? { all: true } : { from: $parameter["statsFrom"], to: $parameter["statsTo"] } }}' as unknown as IDataObject,
						headers: {
							Cookie: '{{$credentials.accessToken}}',
						},
					},
				},
			},
		],
		default: 'getStats',
	},
];

export const parameters: INodeProperties[] = [
	{
		displayName: 'Date From',
		name: 'statsFrom',
		type: 'dateTime',
		description: 'Start date (ISO string). Defaults to 7 days ago if omitted.',
		hint: 'Defaults to 7 days ago if omitted.',
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getStats'],
			},
		},
		default: '',
	},
	{
		displayName: 'Date To',
		name: 'statsTo',
		type: 'dateTime',
		description: 'End date (ISO string). Defaults to now if omitted.',
		hint: 'Defaults to now if omitted.',
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getStats'],
			},
		},
		default: '',
	},
	{
		displayName: 'All Time',
		name: 'statsAll',
		type: 'boolean',
		description: 'Whether to retrieve stats for all time. If set to true, "Date From" and "Date To" will be ignored.',
		hint: 'If set to true, "Date From" and "Date To" will be ignored.',
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getStats'],
			},
		},
		default: false,
	},
];
