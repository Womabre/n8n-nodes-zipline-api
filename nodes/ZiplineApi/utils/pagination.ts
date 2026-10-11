import {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

/**
 * Pagination for File: Get Many with "Return All".
 *
 * Zipline pages with `page`/`perpage` and only returns `pages`/`total` when not
 * searching, so a short page is the one reliable end signal. n8n's built-in
 * `generic` pagination replaces the whole query string on each request (which
 * would drop the search/sort options), hence this function instead.
 */
export async function paginateByPage(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const baseQs = (requestData.options.qs ?? {}) as IDataObject;
	const perpage = Number(baseQs.perpage);
	const results: INodeExecutionData[] = [];

	for (let page = 1; ; page++) {
		requestData.options.qs = { ...baseQs, page };
		const items = await this.makeRoutingRequest(requestData);
		results.push(...items);
		if (items.length === 0 || items.length < perpage) break;
	}

	return results;
}
