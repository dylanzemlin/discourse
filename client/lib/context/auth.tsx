import { createContext, useContext, useState } from "react";

export type AuthState = {
	authed: boolean;
	verifyAuth: () => void;
}

const defaultState: AuthState = {
	authed: false,
	verifyAuth: () => { },
};

const AppContext = createContext<AuthState>(defaultState);
export const useAuthentication = () => {
	return useContext(AppContext);
};

export function AuthenticationProvider({ children }: any) {
	const [authed, setAuthed] = useState(false);

	const verifyAuth = async () => {
		try {
			const result = await fetch("/api/authenticate");
			if (result == null || result.status != 200) {
				throw new Error("Failed Authentication");
			}

			setAuthed(true);
		} catch {
			setAuthed(false);
		}
	}

	const value: AuthState = {
		authed: authed,
		verifyAuth
	}

	return (
		<AppContext.Provider value={value}>
			{children}
		</AppContext.Provider>
	)
}