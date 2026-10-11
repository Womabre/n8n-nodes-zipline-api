import {
	IBinaryData,
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

/**
 * Zipline expects an absolute expiry as `date=<ISO date>`; a bare ISO date is
 * rejected. Relative durations (`1d`, `2h`) and `never` are passed through.
 */
export function normalizeDeletesAt(value: string): string {
	const trimmed = value.trim();
	if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return `date=${trimmed}`;
	return trimmed;
}

/**
 * Maps the Upload "Options" collection to Zipline's `x-zipline-*` upload
 * headers (see Zipline's `src/lib/uploader/parseHeaders.ts`). Unset and
 * zero values are left out so the server's own defaults apply.
 */
export function buildUploadHeaders(options: IDataObject): Record<string, string> {
	const headers: Record<string, string> = {};

	if (options.format) headers['x-zipline-format'] = String(options.format);
	if (options.deletesAt) headers['x-zipline-deletes-at'] = normalizeDeletesAt(String(options.deletesAt));
	if (options.maxViews) headers['x-zipline-max-views'] = String(options.maxViews);
	if (options.password) headers['x-zipline-password'] = String(options.password);
	if (options.folder) headers['x-zipline-folder'] = String(options.folder);
	if (options.originalName) headers['x-zipline-original-name'] = 'true';
	if (options.compression) headers['x-zipline-image-compression-percent'] = String(options.compression);
	if (options.extension) headers['x-zipline-file-extension'] = String(options.extension);

	return headers;
}

/**
 * preSend hook for the File: Upload operation.
 *
 * Zipline's POST /api/upload expects a multipart/form-data body with the file in
 * a form field. We read the configured input binary property, wrap it in a Blob
 * and attach it to a (global) FormData instance, which the n8n HTTP helper sends
 * as multipart (setting the boundary Content-Type automatically). Upload options
 * are sent as `x-zipline-*` headers built by `buildUploadHeaders`.
 */
export async function attachFileFormData(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;
	const binary = this.helpers.assertBinaryData(binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(binaryPropertyName);

	const formData = new FormData();
	const blob = new Blob([new Uint8Array(buffer)], {
		type: binary.mimeType || 'application/octet-stream',
	});
	formData.append('file', blob, binary.fileName || 'file');

	const options = this.getNodeParameter('options', {}) as IDataObject;
	requestOptions.headers = { ...requestOptions.headers, ...buildUploadHeaders(options) };
	requestOptions.body = formData;
	return requestOptions;
}

const MIME_MAP: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	pdf: 'application/pdf',
	txt: 'text/plain',
	json: 'application/json',
	csv: 'text/csv',
	zip: 'application/zip',
	mp4: 'video/mp4',
	mp3: 'audio/mpeg',
};

const GENERIC_MIME_TYPE = 'application/octet-stream';

function resolveHeader(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

function extractFileName(contentDisposition: string, fallback: string): string {
	const extended = contentDisposition.match(/filename\*=[^']*'[^']*'([^;]+)/i);
	if (extended?.[1]) {
		const value = extended[1].trim();
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}
	const quoted = contentDisposition.match(/filename="([^"]+)"/i);
	if (quoted?.[1]) return quoted[1];
	const bare = contentDisposition.match(/filename=([^;]+)/i);
	return bare?.[1]?.trim() ?? fallback;
}

/**
 * Trusts the server's Content-Type and only guesses from the file extension
 * when the server sent nothing useful.
 */
function resolveMimeType(contentType: string, fileName: string): string {
	const serverType = contentType.split(';')[0].trim();
	if (serverType && serverType !== GENERIC_MIME_TYPE) return serverType;
	const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
	return MIME_MAP[ext] ?? GENERIC_MIME_TYPE;
}

/**
 * postReceive hook for the File: Download operation.
 *
 * The /api/user/files/{id}/raw endpoint returns the raw file bytes, so the
 * request is made with `encoding: 'arraybuffer'`. This converts the response
 * body into an n8n binary property, deriving a sensible filename and MIME type,
 * and puts the file's metadata on the item's JSON.
 */
export async function processBinaryResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	responseData: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const contentType = resolveHeader(responseData.headers['content-type'], '');
	const contentDisposition = resolveHeader(responseData.headers['content-disposition'], '');

	const fileId = String(this.getNodeParameter('fileId', '', { extractValue: true }));
	const fileName = extractFileName(contentDisposition, fileId || 'downloaded-file');
	const mimeType = resolveMimeType(contentType, fileName);
	const body = responseData.body as Buffer;

	const binaryData: IBinaryData = await this.helpers.prepareBinaryData(body, fileName, mimeType);

	return items.map((item) => {
		item.json = { fileId, fileName, mimeType, fileSize: body.length };
		item.binary = { data: binaryData };
		return item;
	});
}
