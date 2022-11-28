export enum DiscourseErrorCode {
	// Global Errors
	SERVER_BAD_ENVIRONMENT,
	BAD_METHOD,

	// Email/Password Login Errors
	AUTH_USE_SERVICE,
	AUTH_BAD_CREDENTIALS,

	// Email/Password Register Errors
	AUTH_EMAIL_EXISTS,

	// OAuth Login/Register Errors
	OAUTH_FAILED,
	OAUTH_API_ERROR,
	OAUTH_BAD_SCOPES,
	OAUTH_EMAIL_ALREADY_USED
}