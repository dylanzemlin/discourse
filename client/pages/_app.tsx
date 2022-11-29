import { NotificationsProvider } from '@mantine/notifications';
import { AuthenticationProvider } from '../lib/context/auth';
import { MantineProvider } from '@mantine/core';
import { AppProps } from 'next/app';
import Head from 'next/head';
import "../styles/globals.css";

export default function App(props: AppProps) {
	const { Component, pageProps } = props;

	return (
		<>
			<Head>
				<title>Discourse</title>
				<meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
			</Head>

			<MantineProvider
				withGlobalStyles
				withNormalizeCSS
				theme={{
					colorScheme: 'dark',
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