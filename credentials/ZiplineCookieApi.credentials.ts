import {
	IAuthenticateGeneric,
	Icon,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class ZiplineCookieApi implements ICredentialType {
	name = 'ziplineCookieApi';
	displayName = 'Zipline Cookie API';
	documentationUrl = 'https://zipline.diced.sh/docs/api/authentication';
	icon: Icon = 'file:ZiplineApi.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'userName',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'TOTP Code',
			name: 'totpCode',
			description: 'If your account has 2FA enabled',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Zipline Server URL',
			name: 'ziplineServerUrl',
			type: 'string',
			default: '',
			placeholder: 'e.g. https://zipline.yourdomain.com',
			required: true,
		},
		{
			displayName: 'Session Cookie',
			name: 'sessionCookie',
			type: 'hidden',
			typeOptions: { expirable: true },
			default: '',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<{ sessionCookie: string }> {
		const { ziplineServerUrl, userName, password, totpCode } = credentials as {
			ziplineServerUrl: string;
			userName: string;
			password: string;
			totpCode?: string;
		};

		const base = ziplineServerUrl.replace(/\/+$/, '');

		const res = await this.helpers.httpRequest({
			method: 'POST',
			url: `${base}/api/auth/login`,
			body: {
				username: userName,
				password,
				...(totpCode ? { code: totpCode } : {}),
			},
			json: true,                // ensure JSON body + auto Content-Type
			returnFullResponse: true,  // we need headers
		});

		// Body may also include user.sessions[], but prefer Set-Cookie when present
		const body = (res.body ?? res) as unknown as { user?: { sessions?: string[] } };

		// Normalize set-cookie into an array
		const rawSetCookie = (res.headers?.['set-cookie'] ??
			res.headers?.['Set-Cookie']) as string[] | string | undefined;

		const setCookies = Array.isArray(rawSetCookie)
			? rawSetCookie
			: rawSetCookie
				? [rawSetCookie]
				: [];

		// Find the zipline_session cookie and strip attributes
		let sessionCookie: string | undefined;
		const sessionPair = setCookies.find((c) => typeof c === 'string' && c.startsWith('zipline_session='));
		if (sessionPair) {
			sessionCookie = sessionPair.split(';')[0]; // "zipline_session=..."
		}

		// Fallback: some setups return the session id in JSON (user.sessions[0])
		if (!sessionCookie) {
			const sid = body?.user?.sessions?.[0];
			if (typeof sid === 'string' && sid.length > 0) {
				sessionCookie = `zipline_session=${sid}`;
			}
		}

		if (!sessionCookie) {
			throw new Error('Login failed: no session cookie found in headers or JSON.');
		}

		return { sessionCookie };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				// We stored "zipline_session=..." so pass it directly
				Cookie: '={{$credentials.sessionCookie}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			// Use an endpoint that requires auth so the test is meaningful
			url: '={{$credentials.ziplineServerUrl.replace(/\\/+$/, "")}}/api/user',
			headers: {
				Cookie: '={{$credentials.sessionCookie}}',
			},
		},
	};
}
