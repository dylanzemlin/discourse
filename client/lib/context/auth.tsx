import { createContext, useContext, useEffect, useState } from "react";
import HttpStatusCode from "../api/HttpStatusCode";
import { destroyCookie } from "nookies";

export type AuthState = {
	user: AuthenticatedUser | null;
	loading: boolean;
	revalidate: () => Promise<void>;
	logout: () => void;
}

const defaultState: AuthState = {
	user: null,
	loading: true,
	revalidate: async () => {},
	logout: () => {}
};

const AppContext = createContext<AuthState>(defaultState);
export const useAuthentication = () => useContext(AppContext);

type AuthenticatedUser = {
	id: string;
	username: string;
	flags: number;
	email: string;
	settings: {
		displayName: string;
		color: string;
	}
}

export function AuthenticationProvider({ children }: any) {
	const [user, setUser] = useState<AuthenticatedUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				await revalidate();
				setLoading(false);
			} catch (_) {
				destroyCookie(null, "discourse-session");
				setLoading(false);
			}
		})()
	}, []);

	const revalidate = async () => {
		const response = await fetch("/api/auth");
		if (response.status === HttpStatusCode.OK) {
			const user = await response.json();
			setUser(user);
		} else {
			setUser(null);
			throw new Error("Unauthorized");
		}
	}

	const logout = () => {
		destroyCookie(null, "discourse-session");
		setUser(null);
	}

	return (
		<AppContext.Provider value={{
			user,
			loading,
			revalidate,
			logout
		}}>
			{children}
		</AppContext.Provider>
	)
}