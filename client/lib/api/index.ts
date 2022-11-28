export type APIResponse<T> = {
	/**
	 * The HTTP Status Code
	 */
	status: number;

	/**
	 * The data returned from the API.
	 */
	data?: T;

	/**
	 * The raw error message
	 */
	error?: string;

	/**
	 * The error message to display to the user
	 */
	friendlyError?: string;
}

export interface API {
	REGISTER_USER(name: string, email: string, password: string): Promise<APIResponse<boolean>>;
	LOGIN_USER(email: string, password: string, remember: boolean): Promise<APIResponse<boolean>>;
}

export class GenericAPI {
	async request<T>(url: string, method: string, data?: any): Promise<APIResponse<T>> {
		const result = await fetch(url, {
			method,
			body: data
		});

		if (result.status === 404) {
			return {
				status: 404,
				error: "Not Found",
				friendlyError: "URL Not Found"
			};
		}

		try {
			return {
				status: result.status,
				data: await result.json()
			}
		} catch {
			return {
				status: result.status,
				error: result.statusText,
				friendlyError: "An unknown error occurred"
			};
		}
	}

	async get<T>(version: string, url: string): Promise<APIResponse<T>> {
		return this.request(`api/${version}/${url}`, "GET");
	}

	async post<T>(version: string, url: string, data?: any): Promise<APIResponse<T>> {
		return this.request(`api/${version}/${url}`, "POST", data);
	}

	async delete<T>(version: string, url: string, data?: any): Promise<APIResponse<T>> {
		return this.request(`api/${version}/${url}`, "DELETE", data);
	}
}