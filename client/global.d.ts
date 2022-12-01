namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";

    /**
     * The URL of the pocketbase server
     * @example "https://pocket.dylanzeml.in/"
     */
    POCKETBASE_URL: string;
    /**
     * The email of the admin account
     * @remarks
     * This account **MUST** have full privileges
     */
    POCKETBASE_EMAIL: string;
    /**
     *  The password of the admin account
     */
    POCKETBASE_PASSWORD: string;

    /**
     * The github oauth application secret used in production
     */
    GITHUB_CLIENT_SECRET_PRODUCTION: string;
    /**
     * The github oauth application secret used in production
     */
    GITHUB_CLIENT_SECRET_DEVELOPMENT: string;

    /**
     * The google oauth application secret
     */
    GOOGLE_CLIENT_SECRET: string;
    /**
     * The iron-session password used to encrypt/decrypt session cookies
     * 
     * @remarks
     * This **must** be at least 32 characters long
     */
    IRON_PASSWORD: string;

    /**
     * The github oauth application redirect url
     */
    NEXT_PUBLIC_GITHUB_REDIRECT_URI: string;
    /**
     * The github oauth application client id
     */
    NEXT_PUBLIC_GITHUB_CLIENT_ID: string;

    /**
     * The google oauth application redirect url
     */
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: string;
    /**
     * The google oauth application client id
     */
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;

    /**
     * The URL to the websocket server
     */
    NEXT_PUBLIC_SOCKET_URI: string;

    /**
     * Whether or not github authentication is enabled
     */
    NEXT_PUBLIC_AUTH_GITHUB_ENABLED: "true" | "false";
    /**
     * Whether or not google authentication is enabled
     */
    NEXT_PUBLIC_AUTH_GOOGLE_ENABLED: "true" | "false";
  }
}