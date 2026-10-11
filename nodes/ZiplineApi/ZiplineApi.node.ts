import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

import { searchFiles } from './methods/listSearch';

// Import operations
import * as file from './operations/file';
import * as system from './operations/system';

export class ZiplineApi implements INodeType {
	methods = {
		listSearch: {
			searchFiles,
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Zipline API',
		name: 'ziplineApi',
		usableAsTool: true,
		version: [2],
		group: ['transform'],
		icon: { light: 'file:ZiplineApi.svg', dark: 'file:ZiplineApi.dark.svg' },
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Zipline API',
		defaults: {
			name: 'Zipline API',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],

		credentials: [
			{
				name: 'ziplineTokenApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['token'],
					},
				},
			},
			{
				name: 'ziplineCookieApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['cookie'],
					},
				},
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.ziplineServerUrl.replace(/\\/+$/, "")}}',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Token', value: 'token' },
					{ name: 'Username & Password (Cookie)', value: 'cookie' },
				],
				default: 'token',
				description: 'How to authenticate against the Zipline API',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'File', value: 'file' },
					{ name: 'System', value: 'system' },
				],
				default: 'file',
			},

			// Operations
			...file.operations,
			...file.parameters,
			...system.operations,
			...system.parameters,
		],
	};
}
