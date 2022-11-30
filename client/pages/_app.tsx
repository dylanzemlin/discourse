import { NotificationsProvider } from '@mantine/notifications';
import { AuthenticationProvider } from '../lib/context/auth';
import { useLocalStorage } from '@mantine/hooks';
import { MantineProvider } from '@mantine/core';
import { AppProps } from 'next/app';
import "../styles/globals.css";
import Head from 'next/head';

export default function App(props: AppProps) {
	const { Component, pageProps } = props;
	const [ theme ] = useLocalStorage<"light" | "dark">({ key: "discourse-theme", defaultValue: "dark" });

	return (
		<>
			<Head>
				<title>Discourse</title>
				<meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, height=device-height" />
			</Head>

			<MantineProvider
				withGlobalStyles
				withNormalizeCSS
				theme={{
					colorScheme: theme,
				}}
			>
				<NotificationsProvider
					position="top-right"
					limit={5}
					autoClose={5000}
				>
					<AuthenticationProvider>
						<Component {...pageProps} />
					</AuthenticationProvider>
				</NotificationsProvider>
			</MantineProvider>
		</>
	);
}