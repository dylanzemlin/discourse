import { GenericAPI, API, APIResponse } from ".";

export class V1 extends GenericAPI implements API {
	async REGISTER_USER(name: string, email: string, password: string): Promise<APIResponse<boolean>> {
		return await this.post("v1", "users/register", {
			name, email, password
		});
	}
	async LOGIN_USER(email: string, password: string, remember: boolean): Promise<APIResponse<boolean>> {
		return await this.post("v1", "users/login", {
			email, password, remember
		});
	}
}

const v1 = new V1();
export default v1;