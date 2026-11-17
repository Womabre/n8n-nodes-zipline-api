import { IDataObject, IExecuteSingleFunctions, INodeExecutionData } from 'n8n-workflow';

/**
 * Node version from which Delete returns `{ deleted: true }` and File: Get /
 * Get Many offer Simplify. Workflows saved on an older version keep the raw
 * Zipline responses they were built against.
 */
export const OUTPUT_V3 = 3;

/**
 * The fields File: Get / Get Many keep when Simplify is on. Zipline returns
 * 17-19 keys per file; these are the ones a workflow usually needs. `url` is
 * only present on Get Many items.
 */
export const SIMPLIFIED_FILE_FIELDS = [
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
] as const;

export function simplifyFile(file: IDataObject): IDataObject {
	const simplified: IDataObject = {};
	for (const field of SIMPLIFIED_FILE_FIELDS) {
		if (field in file) simplified[field] = file[field];
	}
	return simplified;
}

function isOutputV3(ctx: IExecuteSingleFunctions): boolean {
	return ctx.getNode().typeVersion >= OUTPUT_V3;
}

/**
 * postReceive hook for File: Get and Get Many. Trims each file to
 * SIMPLIFIED_FILE_FIELDS when the node is v3+ and Simplify is on.
 */
export async function simplifyFileOutput(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	if (!isOutputV3(this)) return items;
	if (!(this.getNodeParameter('simplify', true) as boolean)) return items;
	return items.map((item) => ({ ...item, json: simplifyFile(item.json) }));
}

/**
 * postReceive hook for File: Delete. From v3 the node returns a single
 * `{ deleted: true }` item, as n8n's UX guidelines ask, instead of the deleted
 * file record Zipline sends back.
 */
export async function returnDeleted(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	if (!isOutputV3(this)) return items;
	return [{ json: { deleted: true } }];
}
