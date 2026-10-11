import { describe, it, expect, vi } from 'vitest';
import { searchFiles } from '../listSearch';
import { ILoadOptionsFunctions } from 'n8n-workflow';

function makeCtx(
	httpResponse: unknown,
	params: Record<string, unknown> = { authentication: 'token' },
	credentials: Record<string, unknown> = { ziplineServerUrl: 'https://zipline.example.com/' },
) {
	const httpRequestWithAuthentication = vi.fn().mockResolvedValue(httpResponse);
	const ctx = {
		getCurrentNodeParameter: vi.fn((name: string) => params[name]),
		getCredentials: vi.fn().mockResolvedValue(credentials),
		helpers: { httpRequestWithAuthentication },
	} as unknown as ILoadOptionsFunctions;
	return { ctx, httpRequestWithAuthentication };
}

describe('searchFiles', () => {
	it('lists files, trims a trailing slash off the server URL, and uses the token credential by default', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({
			page: [{ id: '1', name: 'aB3dE9.png', originalName: 'aB3dE9.png' }],
			total: 1,
			pages: 1,
		});

		const result = await searchFiles.call(ctx);

		expect(result.results).toEqual([{ name: 'aB3dE9.png', value: '1' }]);
		expect(result.paginationToken).toBeUndefined();
		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'ziplineTokenApi',
			expect.objectContaining({ url: 'https://zipline.example.com/api/user/files' }),
		);
	});

	it('uses the cookie credential when authentication is set to cookie', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx(
			{ page: [] },
			{ authentication: 'cookie' },
		);

		await searchFiles.call(ctx);

		expect(httpRequestWithAuthentication).toHaveBeenCalledWith('ziplineCookieApi', expect.anything());
	});

	it('appends the original name in parens when it differs from the short name', async () => {
		const { ctx } = makeCtx({ page: [{ id: '1', name: 'aB3dE9.png', originalName: 'my-photo.png' }] });

		const result = await searchFiles.call(ctx);

		expect(result.results).toEqual([{ name: 'aB3dE9.png (my-photo.png)', value: '1' }]);
	});

	it('sends searchField/searchQuery when a filter is typed', async () => {
		const { ctx, httpRequestWithAuthentication } = makeCtx({ page: [] });

		await searchFiles.call(ctx, 'vacation');

		expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
			'ziplineTokenApi',
			expect.objectContaining({ qs: expect.objectContaining({ searchField: 'name', searchQuery: 'vacation' }) }),
		);
	});

	it('uses the exact `pages` field for pagination when present (no filter)', async () => {
		const { ctx } = makeCtx({ page: [{ id: '1', name: 'a' }], pages: 3 }, { authentication: 'token' });

		const result = await searchFiles.call(ctx, undefined, '2');

		expect(result.paginationToken).toBe('3');
	});

	it('falls back to a full-page heuristic for pagination when searching (no `pages` field)', async () => {
		const fullPage = Array.from({ length: 50 }, (_, i) => ({ id: String(i), name: `file${i}` }));
		const { ctx } = makeCtx({ page: fullPage });

		const result = await searchFiles.call(ctx, 'file');

		expect(result.paginationToken).toBe('2');
	});
});
