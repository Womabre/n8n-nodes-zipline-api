import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { fetchFilePage, FileListQuery } from '../fileList';

/** Maps the configured authentication method to the corresponding credential type. */
function getCredentialType(ctx: ILoadOptionsFunctions): string {
	const authentication = (ctx.getCurrentNodeParameter('authentication') as string) || 'token';
	return authentication === 'cookie' ? 'ziplineCookieApi' : 'ziplineTokenApi';
}

/** Performs an authenticated GET against the Zipline API and returns the parsed body. */
async function ziplineGet(ctx: ILoadOptionsFunctions, path: string, qs: IDataObject): Promise<IDataObject> {
	const credentialType = getCredentialType(ctx);
	const credentials = await ctx.getCredentials(credentialType);
	const baseUrl = String(credentials.ziplineServerUrl).replace(/\/+$/, '');
	return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, credentialType, {
		method: 'GET',
		url: `${baseUrl}${path}`,
		qs,
		json: true,
	})) as IDataObject;
}

/**
 * File search backing the resource-locator on `fileId`: one page of the File
 * list per call, newest first, searched by name on the server when a filter
 * is typed. The File list module decides whether another page follows.
 */
export async function searchFiles(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? Number(paginationToken) : 1;
	const query: FileListQuery = { sortBy: 'createdAt', order: 'desc' };
	if (filter) {
		query.searchField = 'name';
		query.searchQuery = filter;
	}

	const { files, hasMore } = await fetchFilePage(
		(qs) => ziplineGet(this, '/api/user/files', qs),
		query,
		page,
	);

	const results = files.map((file) => {
		const name = String(file.name);
		const originalName = file.originalName ? String(file.originalName) : undefined;
		return {
			name: originalName && originalName !== name ? `${name} (${originalName})` : name,
			value: String(file.id),
		};
	});

	return { results, paginationToken: hasMore ? String(page + 1) : undefined };
}
