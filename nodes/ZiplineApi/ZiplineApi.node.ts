import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

// Import operations
import * as upload from './operations/upload';
import * as stats from './operations/stats';
import * as version from './operations/version';
import * as user from './operations/user';

// Import shared parameters
import * as shared from './parameters/shared-parameters';

export class ZiplineApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zipline API',
		name: 'ziplineApi',
		usableAsTool: true,
		version: [2],
		group: ['transform'],
		icon: 'file:ZiplineApi.svg',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Zipline API',
		defaults: {
			name: 'Zipline API',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],

		credentials: [
			// {
			// 	name: 'autodeskVaultDataOAuth2Api',
			// 	required: false,
			// 	displayOptions: {
			// 		show: {
			// 			authentication: ['OAuth2'],
			// 		},
			// 	},
			// },
			{
				name: 'ziplineCookieApi',
				required: false,
				displayOptions: {
					show: {
						authentication: ['Cookie'],
					},
				},
			}
		],
		requestDefaults: {
			baseURL: '={{$credentials.ziplineServerUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Authentication Method',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'Zipline Cookie', value: 'Cookie' },
					// { name: 'Autodesk ID (3-Legged OAuth2)', value: 'OAuth2' },
				],
				default: 'Cookie',
				description: 'Choose the authentication method',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Authentication', value: 'auth' },
					{ name: 'Health Check', value: 'healthCheck' },
					{ name: 'Server', value: 'server' },
					{ name: 'Setup', value: 'setup' },
					{ name: 'Statistic', value: 'stats' },
					{ name: 'Upload', value: 'upload' },
					{ name: 'User', value: 'user' },
					{ name: 'Version', value: 'version' },
				],
				default: 'upload',
			},
			// Operations
			...upload.operations,
			// ...upload.parameters,
			...stats.operations,
			...stats.parameters,
			...version.operations,
			...version.parameters,
			...user.operations,
			...user.parameters,

			// Shared Parameters
			...shared.parameters,
		],
	};
}
