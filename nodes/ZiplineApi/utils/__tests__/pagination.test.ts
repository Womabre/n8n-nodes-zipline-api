import { describe, it, expect, vi } from 'vitest';
import type {
	DeclarativeRestApiSettings,
	IExecutePaginationFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

import { paginateByPage } from '../pagination';

function page(count: number, offset = 0): INodeExecutionData[] {
	return Array.from({ length: count }, (_, i) => ({ json: { id: `f${offset + i}` } }));
}

function makeRequest(perpage: number): DeclarativeRestApiSettings.ResultOptions {
	return {
		options: { url: '/api/user/files', qs: { page: 1, perpage, sortBy: 'name', searchQuery: 'cat' } },
		preSend: [],
		postReceive: [],
	};
}

describe('paginateByPage', () => {
	it('fetches pages until a short page and keeps the other query options', async () => {
		const seenQs: unknown[] = [];
		const pages = [page(2), page(2, 2), page(1, 4)];
		const ctx = {
			makeRoutingRequest: vi.fn(async (req: DeclarativeRestApiSettings.ResultOptions) => {
				seenQs.push({ ...req.options.qs });
				return pages.shift()!;
			}),
		} as unknown as IExecutePaginationFunctions;

		const out = await paginateByPage.call(ctx, makeRequest(2));

		expect(out.map((i) => i.json.id)).toEqual(['f0', 'f1', 'f2', 'f3', 'f4']);
		expect(seenQs).toEqual([
			{ page: 1, perpage: 2, sortBy: 'name', searchQuery: 'cat' },
			{ page: 2, perpage: 2, sortBy: 'name', searchQuery: 'cat' },
			{ page: 3, perpage: 2, sortBy: 'name', searchQuery: 'cat' },
		]);
	});

	it('stops on an empty page when the last page was exactly full', async () => {
		const pages = [page(2), []];
		const ctx = {
			makeRoutingRequest: vi.fn(async () => pages.shift()!),
		} as unknown as IExecutePaginationFunctions;

		const out = await paginateByPage.call(ctx, makeRequest(2));
		expect(out).toHaveLength(2);
		expect(ctx.makeRoutingRequest).toHaveBeenCalledTimes(2);
	});
});
