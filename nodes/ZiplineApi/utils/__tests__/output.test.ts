import { describe, it, expect, vi } from 'vitest';
import type { IExecuteSingleFunctions, INodeExecutionData } from 'n8n-workflow';

import { returnDeleted, simplifyFile, simplifyFileOutput } from '../output';

// A Get Many item as Zipline v4 returns it (19 keys).
const ziplineFile = {
	id: 'cm1',
	createdAt: '2026-11-01T10:00:00.000Z',
	updatedAt: '2026-11-01T10:00:00.000Z',
	deletesAt: null,
	name: 'aB3dE9.png',
	originalName: 'screenshot.png',
	size: 2048,
	type: 'image/png',
	views: 3,
	maxViews: null,
	favorite: false,
	anonymous: false,
	discordPreviewMode: null,
	discordComponentEmbed: null,
	folderId: null,
	password: false,
	thumbnail: null,
	tags: [],
	url: '/u/aB3dE9.png',
};

function ctx(typeVersion: number, simplify = true): IExecuteSingleFunctions {
	return {
		getNode: vi.fn(() => ({ typeVersion })),
		getNodeParameter: vi.fn((name: string) => (name === 'simplify' ? simplify : undefined)),
	} as unknown as IExecuteSingleFunctions;
}

const items = (): INodeExecutionData[] => [{ json: { ...ziplineFile } }];

describe('simplifyFile', () => {
	it('keeps at most ten fields and drops the rest', () => {
		const out = simplifyFile(ziplineFile);
		expect(Object.keys(out)).toEqual([
			'id',
			'name',
			'originalName',
			'type',
			'size',
			'views',
			'favorite',
			'createdAt',
			'deletesAt',
			'url',
		]);
		expect(Object.keys(out).length).toBeLessThanOrEqual(10);
	});

	it('leaves out fields the response does not have (Get has no url)', () => {
		const { url: _url, ...getResponse } = ziplineFile;
		expect(simplifyFile(getResponse)).not.toHaveProperty('url');
	});
});

describe('simplifyFileOutput', () => {
	it('simplifies on v3 when Simplify is on', async () => {
		const out = await simplifyFileOutput.call(ctx(3, true), items());
		expect(out[0].json).toEqual(simplifyFile(ziplineFile));
	});

	it('returns the raw file on v3 when Simplify is off', async () => {
		const out = await simplifyFileOutput.call(ctx(3, false), items());
		expect(out[0].json).toEqual(ziplineFile);
	});

	it('never changes v2 output', async () => {
		const out = await simplifyFileOutput.call(ctx(2, true), items());
		expect(out[0].json).toEqual(ziplineFile);
	});
});

describe('returnDeleted', () => {
	it('returns a single { deleted: true } item on v3', async () => {
		const out = await returnDeleted.call(ctx(3), items());
		expect(out).toEqual([{ json: { deleted: true } }]);
	});

	it('keeps the deleted file record on v2', async () => {
		const out = await returnDeleted.call(ctx(2), items());
		expect(out[0].json).toEqual(ziplineFile);
	});
});
