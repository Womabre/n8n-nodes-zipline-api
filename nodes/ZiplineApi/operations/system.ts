import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['system'],
			},
		},
		options: [
			{
				name: 'Get Version',
				value: 'getVersion',
				action: 'Get version',
				description:
					'Return version details of the backend, including the current version and upstream/latest version information',
				routing: {
					request: {
						method: 'GET',
						url: '/api/version',
					},
				},
			},
			{
				name: 'Health Check',
				value: 'healthCheck',
				action: 'Run a health check',
				description: 'Check whether the Zipline instance is healthy',
				routing: {
					request: {
						method: 'GET',
						url: '/api/healthcheck',
					},
				},
			},
			{
				name: 'Get Stats',
				value: 'getStats',
				action: 'Get stats',
				description: 'Get metrics and statistics for the Zipline instance',
				routing: {
					request: {
						method: 'GET',
						url: '/api/stats',
						qs: {
							all: '={{$parameter["all"] ? true : undefined}}',
							from: '={{!$parameter["all"] ? ($parameter["from"] || undefined) : undefined}}',
							to: '={{!$parameter["all"] ? ($parameter["to"] || undefined) : undefined}}',
						},
					},
				},
			},
		],
		default: 'getVersion',
	},
];

export const parameters: INodeProperties[] = [
	{
		displayName: 'All Time',
		name: 'all',
		type: 'boolean',
		default: false,
		description: 'Whether to retrieve stats for all time. When enabled, "From" and "To" are ignored.',
		displayOptions: {
			show: {
				resource: ['system'],
				operation: ['getStats'],
			},
		},
	},
	{
		displayName: 'From',
		name: 'from',
		type: 'dateTime',
		default: '',
		description: 'Start date for the stats range. Defaults to 7 days ago if omitted.',
		displayOptions: {
			show: {
				resource: ['system'],
				operation: ['getStats'],
				all: [false],
			},
		},
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'dateTime',
		default: '',
		description: 'End date for the stats range. Defaults to now if omitted.',
		displayOptions: {
			show: {
				resource: ['system'],
				operation: ['getStats'],
				all: [false],
			},
		},
	},
];
