import { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['upload'],
			},
		},
		options: [
			{
				name: 'Get Change Order',
				value: 'getChangeOrderById',
				action: 'Get change order',
				description: 'Get change order by its ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/AutodeskDM/Services/api/vault/v2/vaults/{{$parameter["vaultId"]}}/change-orders/{{$parameter["changeOrderId"]}}',
						headers: {
							Authorization: '=Bearer {{$credentials.accessToken}}',
						},
					},
				},
			},
		],
		default: 'getChangeOrderById',
	},
];

// export const parameters: INodeProperties[] = [

// ];
