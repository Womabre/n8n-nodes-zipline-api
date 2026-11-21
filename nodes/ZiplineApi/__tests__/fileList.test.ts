import { describe, it, expect, vi } from 'vitest';
import type { IDataObject, IExecutePaginationFunctions, INodePropertyOptions } from 'n8n-workflow';

import { fetchFilePage, listFiles } from '../fileList';
import { operations as fileOperations } from '../operations/file';
import { getManyFiles } from '../utils/getManyFiles';

/**
 * An in-memory Zipline `GET /api/user/files`: holds `count` files, honours
 * page/perpage, rejects perpage above 100 like Zipline's validation, and
 * reports `pages`/`total` only when `reportsPages` (v4.8.4+, or any version
 * when not searching).
 */
function fakeZipline(count: number, { reportsPages = true } = {}) {
	const all = Array.from({ length: count }, (_, i) => ({
		id: `f${i + 1}`,
		name: `file${i + 1}.png`,
	}));
	const requests: IDataObject[] = [];
	const fetch = vi.fn(async (qs: IDataObject) => {
		requests.push(qs);
		const page = Number(qs.page);
		const perpage = Number(qs.perpage);
		if (perpage < 1 || perpage > 100) throw new Error(`400: perpage ${perpage} out of range`);
		const body: IDataObject = { page: all.slice((page - 1) * perpage, page * perpage) };
		if (reportsPages) {
			body.total = count;
			body.pages = Math.ceil(count / perpage);
		}
		return body;
	});
	return { fetch, requests };
}

describe('listFiles: end of pages', () => {
	it('stops at the last page Zipline reports, without an extra request', async () => {
		const { fetch, requests } = fakeZipline(200);
		const files = await listFiles(fetch, {});
		expect(files).toHaveLength(200);
		expect(requests.map((r) => r.page)).toEqual([1, 2]);
	});

	it('falls back to a short page when Zipline leaves out pages (older servers while searching)', async () => {
		const { fetch, requests } = fakeZipline(250, { reportsPages: false });
		const files = await listFiles(fetch, { searchQuery: 'file' });
		expect(files).toHaveLength(250);
		expect(requests.map((r) => r.page)).toEqual([1, 2, 3]);
	});

	it('needs one empty request to see the end when the last page is exactly full and pages is missing', async () => {
		const { fetch, requests } = fakeZipline(200, { reportsPages: false });
		expect(await listFiles(fetch, {})).toHaveLength(200);
		expect(requests.map((r) => r.page)).toEqual([1, 2, 3]);
	});

	it('returns nothing for an empty File list after one request', async () => {
		const { fetch, requests } = fakeZipline(0);
		expect(await listFiles(fetch, {})).toEqual([]);
		expect(requests).toHaveLength(1);
	});

	it('stops when a page comes back empty even if pages says there are more', async () => {
		const fetch = vi.fn(async () => ({ page: [], pages: 5 }));
		expect(await listFiles(fetch, {})).toEqual([]);
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});

describe('listFiles: limit', () => {
	it('returns exactly the limit across pages of at most 100 (limit 250)', async () => {
		const { fetch, requests } = fakeZipline(1000);
		const files = await listFiles(fetch, {}, { limit: 250 });
		expect(files).toHaveLength(250);
		expect(files[249]).toEqual({ id: 'f250', name: 'file250.png' });
		expect(requests.every((r) => Number(r.perpage) <= 100)).toBe(true);
		expect(requests.map((r) => r.page)).toEqual([1, 2, 3]);
	});

	it('asks for just the limit when it fits in one page', async () => {
		const { fetch, requests } = fakeZipline(1000);
		expect(await listFiles(fetch, {}, { limit: 10 })).toHaveLength(10);
		expect(requests).toEqual([{ page: 1, perpage: 10 }]);
	});

	it('returns fewer than the limit when the File list is shorter', async () => {
		const { fetch } = fakeZipline(30);
		expect(await listFiles(fetch, {}, { limit: 50 })).toHaveLength(30);
	});
});

describe('listFiles: query', () => {
	it('sends set options and leaves unset ones out', async () => {
		const { fetch, requests } = fakeZipline(1);
		await listFiles(
			fetch,
			{
				sortBy: 'size',
				order: 'asc',
				filter: 'dashboard',
				favorite: false,
				searchQuery: '',
				folder: 'f1',
			},
			{ limit: 5 },
		);
		expect(requests[0]).toEqual({
			page: 1,
			perpage: 5,
			sortBy: 'size',
			order: 'asc',
			filter: 'dashboard',
			folder: 'f1',
		});
	});
});

describe('fetchFilePage', () => {
	it('reports more pages until the last one', async () => {
		const { fetch } = fakeZipline(150);
		const first = await fetchFilePage(fetch, {}, 1);
		const second = await fetchFilePage(fetch, {}, 2);
		expect([first.files.length, first.hasMore]).toEqual([100, true]);
		expect([second.files.length, second.hasMore]).toEqual([50, false]);
	});
});

describe('Get Many (getManyFiles pagination function)', () => {
	const ziplineFile = (i: number) => ({
		id: `f${i}`,
		name: `file${i}.png`,
		originalName: `orig${i}.png`,
		type: 'image/png',
		size: 10,
		views: 0,
		favorite: false,
		createdAt: '2026-11-01T00:00:00.000Z',
		deletesAt: null,
		url: `/u/file${i}.png`,
		maxViews: null,
		thumbnail: null,
	});

	function ctx(params: IDataObject, typeVersion: number, total: number) {
		const all = Array.from({ length: total }, (_, i) => ziplineFile(i + 1));
		const makeRoutingRequest = vi.fn(async (requestData: { options: { qs: IDataObject } }) => {
			const { page, perpage } = requestData.options.qs as { page: number; perpage: number };
			const body = {
				page: all.slice((page - 1) * perpage, page * perpage),
				total,
				pages: Math.ceil(total / perpage),
			};
			return [{ json: body }];
		});
		const pagination = {
			getNodeParameter: vi.fn((name: string, fallback: unknown) =>
				name in params ? params[name] : fallback,
			),
			getNode: vi.fn(() => ({ typeVersion })),
			makeRoutingRequest,
		} as unknown as IExecutePaginationFunctions;
		const requestData = {
			options: { method: 'GET', url: '/api/user/files' },
			preSend: [],
			postReceive: [],
			requestOperations: {},
		} as never;
		return { pagination, requestData, makeRoutingRequest };
	}

	it('returns one simplified item per file up to Limit on v3, keeping the routing request options', async () => {
		const { pagination, requestData, makeRoutingRequest } = ctx(
			{ returnAll: false, limit: 120, options: { sortBy: 'size' }, simplify: true },
			3,
			500,
		);
		const items = await getManyFiles.call(pagination, requestData);
		expect(items).toHaveLength(120);
		expect(Object.keys(items[0].json)).not.toContain('maxViews');
		expect(items[0].json).toMatchObject({ id: 'f1', url: '/u/file1.png' });
		expect(makeRoutingRequest).toHaveBeenCalledTimes(2);
		expect(makeRoutingRequest.mock.calls[0][0]).toMatchObject({
			options: {
				method: 'GET',
				url: '/api/user/files',
				qs: { page: 1, perpage: 100, sortBy: 'size' },
			},
		});
	});

	it('returns every raw file with Return All on v2', async () => {
		const { pagination, requestData } = ctx({ returnAll: true }, 2, 230);
		const items = await getManyFiles.call(pagination, requestData);
		expect(items).toHaveLength(230);
		expect(items[0].json).toEqual(ziplineFile(1));
	});

	it('returns raw files on v3 when Simplify is off', async () => {
		const { pagination, requestData } = ctx({ returnAll: false, limit: 3, simplify: false }, 3, 10);
		const items = await getManyFiles.call(pagination, requestData);
		expect(items.map((i) => i.json)).toEqual([ziplineFile(1), ziplineFile(2), ziplineFile(3)]);
	});

	it('is what the File: Get Many operation routes through, on every run', () => {
		const operation = fileOperations[0].options as INodePropertyOptions[];
		const getMany = operation.find((o) => o.value === 'getAll');
		expect(getMany?.routing?.send?.paginate).toBe(true);
		expect(getMany?.routing?.operations?.pagination).toBe(getManyFiles);
		expect(getMany?.routing?.request?.qs).toBeUndefined();
		expect(getMany?.routing?.output).toBeUndefined();
	});
});
