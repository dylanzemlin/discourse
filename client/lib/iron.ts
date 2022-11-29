declare module "iron-session" {
  interface IronSessionData {
    user?: {
      id: string;
			name: string;
			email: string;
			username: string;
			admin: boolean;
    };
  }
}

import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
	GetServerSidePropsContext,
	GetServerSidePropsResult,
	NextApiHandler,
} from "next";

const sessionOptions = {
	password: process.env.IRON_PASSWORD as string,
	cookieName: "discourse-session",
	// secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
	},
};

export function withSessionRoute(handler: NextApiHandler) {
	return withIronSessionApiRoute(handler, sessionOptions);
}

// Theses types are compatible with InferGetStaticPropsType https://nextjs.org/docs/basic-features/data-fetching#typescript-use-getstaticprops
export function withSessionSsr<
	P extends { [key: string]: unknown } = { [key: string]: unknown },
>(
	handler: (
		context: GetServerSidePropsContext,
	) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>,
) {
	return withIronSessionSsr(handler, sessionOptions);
}