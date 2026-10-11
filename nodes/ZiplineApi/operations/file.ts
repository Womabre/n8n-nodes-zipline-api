import { INodeProperties } from 'n8n-workflow';

import { attachFileFormData, processBinaryResponse } from '../utils/binary';
import { paginateByPage } from '../utils/pagination';
import { resourceLocatorModes } from '../parameters/shared-parameters';

/** Page size used while fetching every file for "Return All". */
const RETURN_ALL_PAGE_SIZE = 100;

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a file',
				description: 'Upload a file to Zipline',
				routing: {
					request: {
						method: 'POST',
						url: '/api/upload',
					},
					// Builds the multipart body and the x-zipline-* option headers
					send: {
						preSend: [attachFileFormData],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many files',
				description: "Retrieve a list of the authenticated user's files",
				routing: {
					request: {
						method: 'GET',
						url: '/api/user/files',
						qs: {
							page: 1,
							perpage: `={{$parameter["returnAll"] ? ${RETURN_ALL_PAGE_SIZE} : $parameter["limit"]}}`,
							sortBy: '={{$parameter["options"]["sortBy"] || undefined}}',
							order: '={{$parameter["options"]["order"] || undefined}}',
							filter: '={{$parameter["options"]["filter"] || undefined}}',
							favorite: '={{$parameter["options"]["favorite"] || undefined}}',
							searchField: '={{$parameter["options"]["searchField"] || undefined}}',
							searchQuery: '={{$parameter["options"]["searchQuery"] || undefined}}',
							folder: '={{$parameter["options"]["folder"] || undefined}}',
						},
					},
					send: {
						paginate: '={{$parameter["returnAll"]}}',
					},
					operations: {
						pagination: paginateByPage,
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: { property: 'page' },
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a file',
				description: 'Get a single file by its ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/user/files/{{$parameter["fileId"]}}',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a file',
				description: "Update a file's metadata",
				routing: {
					request: {
						method: 'PATCH',
						url: '=/api/user/files/{{$parameter["fileId"]}}',
						body: '={{$parameter["updateFields"]}}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a file',
				description: 'Delete a file by its ID',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/api/user/files/{{$parameter["fileId"]}}',
					},
				},
			},
			{
				name: 'Download',
				value: 'download',
				action: 'Download a file',
				description: 'Download the raw contents of a file as binary data',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/user/files/{{$parameter["fileId"]}}/raw',
						returnFullResponse: true,
						encoding: 'arraybuffer',
					},
					output: {
						postReceive: [processBinaryResponse],
					},
				},
			},
		],
		default: 'upload',
	},
];

export const parameters: INodeProperties[] = [
	// ----- Upload -----
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'The name of the input binary field containing the file to upload',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['upload'],
			},
		},
		options: [
			{
				displayName: 'Compression',
				name: 'compression',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 100 },
				default: 0,
				description: 'Image compression percentage (0-100)',
			},
			{
				displayName: 'Deletes At',
				name: 'deletesAt',
				type: 'string',
				default: '',
				placeholder: 'e.g. 1d, 2h, never, or 2026-12-31T00:00:00Z',
				description:
					'When the file should automatically expire: a duration, "never", or an ISO date (sent to Zipline as date=…)',
			},
			{
				displayName: 'Extension',
				name: 'extension',
				type: 'string',
				default: '',
				description: 'Override the file extension',
			},
			{
				displayName: 'File Name Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'Date', value: 'date' },
					{ name: 'Gfycat', value: 'gfycat' },
					{ name: 'Name', value: 'name' },
					{ name: 'Random', value: 'random' },
					{ name: 'Random Words', value: 'random-words' },
					{ name: 'UUID', value: 'uuid' },
				],
				default: 'random',
				description: 'How the uploaded file name is generated',
			},
			{
				displayName: 'Folder ID',
				name: 'folder',
				type: 'string',
				default: '',
				description: 'ID of the folder to upload the file into',
			},
			{
				displayName: 'Max Views',
				name: 'maxViews',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Delete the file after this many views (0 = unlimited)',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Protect the file with a password',
			},
			{
				displayName: 'Use Original Name',
				name: 'originalName',
				type: 'boolean',
				default: false,
				description: "Whether to store the uploaded file's original name on the file record",
			},
		],
	},
	// ----- Get Many -----
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['getAll'],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Favorite Only',
				name: 'favorite',
				type: 'boolean',
				default: false,
				description: 'Whether to only return favorited files',
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'options',
				options: [
					{ name: 'All Files', value: 'none' },
					{ name: 'Media Only', value: 'dashboard' },
				],
				default: 'none',
				description:
					'Which set of files to return. "Media Only" limits results to image, video, audio and text files, like the Zipline dashboard.',
			},
			{
				displayName: 'Folder ID',
				name: 'folder',
				type: 'string',
				default: '',
				description: 'Only return files within this folder',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'desc',
				description: 'Sort direction',
			},
			{
				displayName: 'Search Field',
				name: 'searchField',
				type: 'options',
				options: [
					{ name: 'ID', value: 'id' },
					{ name: 'Name', value: 'name' },
					{ name: 'Original Name', value: 'originalName' },
					{ name: 'Tags', value: 'tags' },
					{ name: 'Type', value: 'type' },
				],
				default: 'name',
				description: 'Which field to search in',
			},
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				description: 'Text to search for in the selected search field',
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Created At', value: 'createdAt' },
					{ name: 'Deletes At', value: 'deletesAt' },
					{ name: 'Favorite', value: 'favorite' },
					{ name: 'ID', value: 'id' },
					{ name: 'Name', value: 'name' },
					{ name: 'Original Name', value: 'originalName' },
					{ name: 'Size', value: 'size' },
					{ name: 'Type', value: 'type' },
					{ name: 'Updated At', value: 'updatedAt' },
					{ name: 'Views', value: 'views' },
				],
				default: 'createdAt',
				description: 'Field to sort by',
			},
		],
	},
	// ----- Get / Update / Delete / Download -----
	{
		displayName: 'File',
		name: 'fileId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The file to use. Search by name and select from the list, or provide the ID (or short name) directly.',
		modes: resourceLocatorModes('searchFiles', 'e.g. aB3dE9.png'),
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['get', 'update', 'delete', 'download'],
			},
		},
	},
	// ----- Update -----
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Favorite',
				name: 'favorite',
				type: 'boolean',
				default: false,
				description: 'Whether the file is favorited',
			},
			{
				displayName: 'Max Views',
				name: 'maxViews',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Delete the file after this many views',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'The (short) name of the file',
			},
			{
				displayName: 'Original Name',
				name: 'originalName',
				type: 'string',
				default: '',
				description: 'The original file name',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Set (or clear) the file password',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'string',
				default: '',
				description: 'The MIME type of the file',
			},
		],
	},
];
