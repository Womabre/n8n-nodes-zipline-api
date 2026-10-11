import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

const PAGE_SIZE = 50;

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
 * File search backing the resource-locator on `fileId`. Uses Zipline's own
 * `GET /api/user/files` search (`searchField=name`/`searchQuery`) rather than
 * client-side filtering, since the endpoint supports it server-side. When
 * searching by text the API omits `pages`/`total`, so a full page is treated
 * as "there may be more"; without a filter, `pages` gives an exact answer.
 */
export async function searchFiles(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? Number(paginationToken) : 1;
	const qs: IDataObject = { page, perpage: PAGE_SIZE, sortBy: 'createdAt', order: 'desc' };
	if (filter) {
		qs.searchField = 'name';
		qs.searchQuery = filter;
	}

	const body = await ziplineGet(this, '/api/user/files', qs);
	const files = (body.page as IDataObject[]) ?? [];

	const results = files.map((file) => {
		const name = String(file.name);
		const originalName = file.originalName ? String(file.originalName) : undefined;
		return {
			name: originalName && originalName !== name ? `${name} (${originalName})` : name,
			value: String(file.id),
		};
	});

	const hasMore = typeof body.pages === 'number' ? page < (body.pages as number) : files.length === PAGE_SIZE;
	return { results, paginationToken: hasMore ? String(page + 1) : undefined };
}
