import { createContext, useContext, useEffect, useState } from "react";
import { DiscouseUserFlags } from "@lib/api/DiscourseUserFlags";
import HttpStatusCode from "../api/HttpStatusCode";
import { destroyCookie } from "nookies";

export type AuthState = {
	user: AuthenticatedUser | null;
	loading: boolean;
	revalidate: () => Promise<void>;
	logout: () => void;
	hasFlag: (flag: DiscouseUserFlags) => boolean;
}

const defaultState: AuthState = {
	user: null,
	loading: true,
	revalidate: async () => {},
	logout: () => {},
	hasFlag: (flag: DiscouseUserFlags) => false
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

	const hasFlag = (flag: DiscouseUserFlags) => {
		if (user == null) {
			return false;
		}

		return (user.flags & flag) === flag;
	}

	return (
		<AppContext.Provider value={{
			user,
			loading,
			revalidate,
			logout,
			hasFlag
		}}>
			{children}
		</AppContext.Provider>
	)
}