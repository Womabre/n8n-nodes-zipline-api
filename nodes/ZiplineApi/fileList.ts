import { IDataObject } from 'n8n-workflow';

/**
 * The File list: the authenticated user's files from Zipline's paged
 * `GET /api/user/files`. This module owns the three things every caller would
 * otherwise have to know about that endpoint:
 *
 * - which query options it takes, and that unset ones must be left out;
 * - that it rejects `perpage` above 100;
 * - when the last page has been reached. Zipline v4.8.4+ always reports
 *   `pages`; older servers leave it out while searching, so a page shorter
 *   than requested is the fallback end signal.
 */

/** Zipline's validation rejects a larger `perpage`. */
const MAX_PAGE_SIZE = 100;

/** File list options, named as Zipline's query string names them. */
export interface FileListQuery {
	sortBy?: string;
	order?: string;
	filter?: string;
	favorite?: boolean;
	searchField?: string;
	searchQuery?: string;
	folder?: string;
}

/**
 * Fetches one page of the File list for the given query string and returns
 * Zipline's response body as-is (`{ page, total?, pages? }`).
 */
export type FetchFilePage = (qs: IDataObject) => Promise<IDataObject>;

interface FilePage {
	files: IDataObject[];
	hasMore: boolean;
}

async function getPage(
	fetch: FetchFilePage,
	query: FileListQuery,
	page: number,
	perpage: number,
): Promise<FilePage> {
	const qs: IDataObject = { page, perpage };
	for (const [key, value] of Object.entries(query)) {
		// Unset options are left out so Zipline's own defaults apply.
		if (value) qs[key] = value;
	}

	const body = await fetch(qs);
	const files = Array.isArray(body.page) ? (body.page as IDataObject[]) : [];
	const hasMore =
		files.length > 0 &&
		(typeof body.pages === 'number' ? page < body.pages : files.length === perpage);
	return { files, hasMore };
}

/**
 * One page of the File list, for callers that page lazily (the file picker).
 * `page` starts at 1.
 */
export async function fetchFilePage(
	fetch: FetchFilePage,
	query: FileListQuery,
	page: number,
): Promise<FilePage> {
	return await getPage(fetch, query, page, MAX_PAGE_SIZE);
}

/**
 * The File list up to `limit` files, or every file when `limit` is left out.
 * Fetches as many pages as that takes.
 */
export async function listFiles(
	fetch: FetchFilePage,
	query: FileListQuery,
	options: { limit?: number } = {},
): Promise<IDataObject[]> {
	const { limit } = options;
	const perpage = limit === undefined ? MAX_PAGE_SIZE : Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
	const files: IDataObject[] = [];

	for (let page = 1; ; page++) {
		const result = await getPage(fetch, query, page, perpage);
		files.push(...result.files);
		if (limit !== undefined && files.length >= limit) return files.slice(0, limit);
		if (!result.hasMore) return files;
	}
}
