import { describe, it, expect, vi } from 'vitest';
import type {
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

import {
	attachFileFormData,
	buildUploadHeaders,
	normalizeDeletesAt,
	processBinaryResponse,
} from '../binary';

describe('attachFileFormData', () => {
	it('attaches the input binary as multipart form-data', async () => {
		const ctx = {
			getNodeParameter: vi.fn((name: string) => (name === 'options' ? {} : 'data')),
			helpers: {
				assertBinaryData: vi.fn().mockReturnValue({ fileName: 'pic.png', mimeType: 'image/png' }),
				getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from('hello world')),
			},
		} as unknown as IExecuteSingleFunctions;

		const result = await attachFileFormData.call(ctx, {
			url: '/api/upload',
			headers: {},
		} as IHttpRequestOptions);

		expect(result.body).toBeInstanceOf(FormData);
		const file = (result.body as FormData).get('file') as File;
		expect(file).toBeInstanceOf(Blob);
		expect(file.name).toBe('pic.png');
		expect(file.type).toBe('image/png');
	});

	it('falls back to a default name and mime type', async () => {
		const ctx = {
			getNodeParameter: vi.fn((name: string) => (name === 'options' ? {} : 'data')),
			helpers: {
				assertBinaryData: vi.fn().mockReturnValue({}),
				getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from('x')),
			},
		} as unknown as IExecuteSingleFunctions;

		const result = await attachFileFormData.call(ctx, { url: '/api/upload' } as IHttpRequestOptions);
		const file = (result.body as FormData).get('file') as File;
		expect(file.name).toBe('file');
		expect(file.type).toBe('application/octet-stream');
	});
});

describe('buildUploadHeaders', () => {
	it("maps every option to Zipline's header names", () => {
		expect(
			buildUploadHeaders({
				format: 'uuid',
				deletesAt: '1d',
				maxViews: 5,
				password: 'secret',
				folder: 'fld1',
				originalName: true,
				compression: 80,
				extension: 'jpg',
			}),
		).toEqual({
			'x-zipline-format': 'uuid',
			'x-zipline-deletes-at': '1d',
			'x-zipline-max-views': '5',
			'x-zipline-password': 'secret',
			'x-zipline-folder': 'fld1',
			'x-zipline-original-name': 'true',
			'x-zipline-image-compression-percent': '80',
			'x-zipline-file-extension': 'jpg',
		});
	});

	it('leaves out unset, empty, false and zero options', () => {
		expect(
			buildUploadHeaders({ deletesAt: '', maxViews: 0, compression: 0, originalName: false }),
		).toEqual({});
	});

	it('passes the headers through attachFileFormData', async () => {
		const ctx = {
			getNodeParameter: vi.fn((name: string) => (name === 'options' ? { maxViews: 3 } : 'data')),
			helpers: {
				assertBinaryData: vi.fn().mockReturnValue({}),
				getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from('x')),
			},
		} as unknown as IExecuteSingleFunctions;

		const result = await attachFileFormData.call(ctx, {
			url: '/api/upload',
			headers: { Accept: 'application/json' },
		} as IHttpRequestOptions);
		expect(result.headers).toEqual({ Accept: 'application/json', 'x-zipline-max-views': '3' });
	});
});

describe('normalizeDeletesAt', () => {
	it('prefixes ISO dates with date=', () => {
		expect(normalizeDeletesAt('2026-12-31T00:00:00Z')).toBe('date=2026-12-31T00:00:00Z');
		expect(normalizeDeletesAt(' 2026-12-31 ')).toBe('date=2026-12-31');
	});

	it('passes durations, never and already-prefixed values through', () => {
		expect(normalizeDeletesAt('1d')).toBe('1d');
		expect(normalizeDeletesAt('never')).toBe('never');
		expect(normalizeDeletesAt('date=2026-12-31')).toBe('date=2026-12-31');
	});
});

describe('processBinaryResponse', () => {
	/** Mimics n8n: a resource locator comes back as an object unless extractValue is set. */
	function makeContext(prepareBinaryData: ReturnType<typeof vi.fn>, fileId = 'abc123') {
		const locator = { __rl: true, mode: 'list', value: fileId };
		return {
			getNodeParameter: vi.fn((_name: string, _fallback: unknown, options?: { extractValue?: boolean }) =>
				options?.extractValue ? locator.value : locator,
			),
			helpers: { prepareBinaryData },
		} as unknown as IExecuteSingleFunctions;
	}

	it('derives the filename from content-disposition and sets binary output and metadata', async () => {
		const prepared = { mimeType: 'image/png', data: 'base64data', fileName: 'cat.png' };
		const prepareBinaryData = vi.fn().mockResolvedValue(prepared);
		const ctx = makeContext(prepareBinaryData);

		const response = {
			headers: {
				'content-type': 'image/png',
				'content-disposition': 'attachment; filename="cat.png"',
			},
			body: Buffer.from('imagedata'),
		} as unknown as IN8nHttpFullResponse;

		const out = await processBinaryResponse.call(ctx, [{ json: { old: true } }], response);

		expect(prepareBinaryData).toHaveBeenCalledWith(response.body, 'cat.png', 'image/png');
		expect(out[0].binary).toEqual({ data: prepared });
		expect(out[0].json).toEqual({
			fileId: 'abc123',
			fileName: 'cat.png',
			mimeType: 'image/png',
			fileSize: 9,
		});
	});

	it('falls back to the resource-locator value when no content-disposition is present', async () => {
		const prepareBinaryData = vi.fn().mockResolvedValue({ mimeType: 'application/zip', data: 'd' });
		const ctx = makeContext(prepareBinaryData, 'myfile');

		const response = {
			headers: { 'content-type': 'application/zip' },
			body: Buffer.from('zipdata'),
		} as unknown as IN8nHttpFullResponse;

		const items: INodeExecutionData[] = [{ json: {} }];
		await processBinaryResponse.call(ctx, items, response);

		expect(prepareBinaryData).toHaveBeenCalledWith(response.body, 'myfile', 'application/zip');
	});

	it("trusts the server's content-type over the file extension", async () => {
		const prepareBinaryData = vi.fn().mockResolvedValue({});
		const ctx = makeContext(prepareBinaryData);

		const response = {
			headers: {
				'content-type': 'image/avif; charset=binary',
				'content-disposition': 'attachment; filename="photo.png"',
			},
			body: Buffer.from('x'),
		} as unknown as IN8nHttpFullResponse;

		await processBinaryResponse.call(ctx, [{ json: {} }], response);
		expect(prepareBinaryData).toHaveBeenCalledWith(response.body, 'photo.png', 'image/avif');
	});

	it('guesses from the extension only when the server type is missing or generic', async () => {
		const prepareBinaryData = vi.fn().mockResolvedValue({});
		const ctx = makeContext(prepareBinaryData);

		const generic = {
			headers: {
				'content-type': 'application/octet-stream',
				'content-disposition': 'attachment; filename="doc.pdf"',
			},
			body: Buffer.from('x'),
		} as unknown as IN8nHttpFullResponse;
		await processBinaryResponse.call(ctx, [{ json: {} }], generic);
		expect(prepareBinaryData).toHaveBeenLastCalledWith(generic.body, 'doc.pdf', 'application/pdf');

		const missing = {
			headers: { 'content-disposition': 'attachment; filename="blob.xyz"' },
			body: Buffer.from('x'),
		} as unknown as IN8nHttpFullResponse;
		await processBinaryResponse.call(ctx, [{ json: {} }], missing);
		expect(prepareBinaryData).toHaveBeenLastCalledWith(
			missing.body,
			'blob.xyz',
			'application/octet-stream',
		);
	});
});
