import { GenericAPI, API, APIResponse } from ".";

export class V1 extends GenericAPI implements API {
	async REGISTER_USER(displayname: string, username: string, email: string, password: string): Promise<APIResponse<any>> {
		return await this.post("oauth", `email?email=${email}&username=${username}&displayname=${displayname}&password=${password}`);
	}
	async LOGIN_USER(email: string, password: string): Promise<APIResponse<any>> {
		return await this.get("oauth", `email?email=${email}&password=${password}`);
	}
}

const v1 = new V1();
export default v1;