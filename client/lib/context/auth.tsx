import { createContext, useContext, useEffect, useState } from "react";
import HttpStatusCode from "../api/HttpStatusCode";

export type AuthState = {
	authed: boolean;
	user: {
		id: string;
		name: string;
		email: string;
	} | undefined,
	verifyAuth: () => Promise<void>;
	loading: boolean;
}

const defaultState: AuthState = {
	authed: false,
	user: undefined,
	verifyAuth: async () => { },
	loading: true
};

const AppContext = createContext<AuthState>(defaultState);
export const useAuthentication = () => {
	return useContext(AppContext);
};

export function AuthenticationProvider({ children }: any) {
	const [authed, setAuthed] = useState(false);
	const [loading, setLoading] = useState(true);
	const [id, setUid] = useState<string | undefined>();
	const [name, setName] = useState<string | undefined>();
	const [email, setEmail] = useState<string | undefined>();

	const verifyAuth = async () => {
		try {
			const result = await fetch("/api/auth");
			if (result == null || result.status !== HttpStatusCode.OK) {
				throw new Error("Failed Authentication");
			}

			const data = await result.json();
			setUid(data.id);
			setName(data.name);
			setEmail(data.email);
			setAuthed(true);
		} catch {
			setAuthed(false);
		}
	}

	useEffect(() => {
		verifyAuth().then(() => {
			setLoading(false);
		}).catch(() => {
			setLoading(false);
		});
	}, []);

	const value: AuthState = {
		authed,
		user: {
			id: id as string,
			name: name as string,
			email: email as string
		},
		verifyAuth,
		loading
	}

	return (
		<AppContext.Provider value={value}>
			{children}
		</AppContext.Provider>
	)
}