import { createContext, useContext, useEffect, useState } from "react";
import HttpStatusCode from "../api/HttpStatusCode";

export type AuthState = {
	authed: boolean;
	user: {
		id: string;
		displayname: string;
		username: string;
		flags: number;
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
	const [username, setUsername] = useState<string | undefined>();
	const [displayname, setDisplayname] = useState<string | undefined>();
	const [flags, setFlags] = useState<number>(0);
	const [email, setEmail] = useState<string | undefined>();

	const verifyAuth = async () => {
		try {
			const result = await fetch("/api/auth");
			if (result == null || result.status !== HttpStatusCode.OK) {
				throw new Error("Failed Authentication");
			}

			const data = await result.json();
			setUid(data.id);
			setUsername(data.username);
			setDisplayname(data.displayname);
			setFlags(data.flags);
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
			email: email as string,
			displayname: displayname as string,
			username: username as string,
			flags
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