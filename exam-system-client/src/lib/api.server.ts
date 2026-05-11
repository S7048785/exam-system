// src/lib/api.server.ts
import {getRequest} from "@tanstack/react-start/server";

export async function getServerCookies() {
	const request = getRequest();
	return request.headers.get("Cookie") || "";
}

export async function createServerFetch() {
	const cookies = await getServerCookies();

	return async (url: string, options?: RequestInit) => {
		return fetch(url, {
			...options,
			headers: {
				...options?.headers,
				Cookie: cookies  // 注意是 Cookie 不是 cookies
			}
		});
	};
}