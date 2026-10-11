import { INodePropertyMode } from 'n8n-workflow';

/**
 * Builds the "From List" / "By ID" modes for a resource-locator field backed by
 * a searchable listSearch method. Zipline file identifiers aren't a fixed
 * format (short random `name` or a longer `id`, both accepted by the API), so
 * the "By ID" mode has no regex validation — unlike a strict UUID/numeric ID.
 *
 * @param searchListMethod Name of the registered listSearch method
 * @param idPlaceholder    Placeholder for the manual "By ID" input
 * @param idHint           Optional hint text for the manual "By ID" input
 */
export function resourceLocatorModes(
	searchListMethod: string,
	idPlaceholder: string,
	idHint?: string,
): INodePropertyMode[] {
	// Resource-locator modes are not node parameters and have no `default`; the
	// lint rule cannot tell them apart when they are built in a helper function.
	/* eslint-disable n8n-nodes-base/node-param-default-missing */
	return [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod,
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: idPlaceholder,
			...(idHint ? { hint: idHint } : {}),
		},
	];
	/* eslint-enable n8n-nodes-base/node-param-default-missing */
}
