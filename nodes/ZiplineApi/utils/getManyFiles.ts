import {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

import { FetchFilePage, FileListQuery, listFiles } from '../fileList';
import { simplifyFileOutput } from './output';

/**
 * Pagination function for File: Get Many. The operation always runs through
 * here (`paginate: true`), so the File list module sees Zipline's whole
 * response on every page and Limit can span more than one page. Each request
 * goes through n8n's routing, which adds the base URL and credentials.
 */
export async function getManyFiles(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const returnAll = this.getNodeParameter('returnAll', false) as boolean;
	const limit = returnAll ? undefined : (this.getNodeParameter('limit', 50) as number);
	const query = this.getNodeParameter('options', {}) as FileListQuery;

	const fetch: FetchFilePage = async (qs) => {
		const items = await this.makeRoutingRequest({
			...requestData,
			options: { ...requestData.options, qs },
		});
		return (items[0]?.json ?? {}) as IDataObject;
	};

	const files = await listFiles(fetch, query, { limit });
	return await simplifyFileOutput.call(
		this,
		files.map((json) => ({ json })),
	);
}
