# Environment Setup

The Discourse project has various environment files that must be setup before the project can be run. This document will walk you through the process of setting up your environment.

## Client Environment

The client environment should be setup in the `client` directory. First, start by taking the `.example` off the end of [.env.local.example](/client/.env.local.example).

The only required fields to get the application running are the following:
```bash
POCKETBASE_URL = https://example.com/ # required
POCKETBASE_EMAIL = example@test.com # required
POCKETBASE_PASSWORD = super_secure_password # required
IRON_PASSWORD = 32_character_long_password # required
```

To get your pocketbase credentials and urls, see [pocketbase.md](./pocketbase.md). Or, if you email dylan.zemlin@ou.edu he can give you credentials to the pre-existing database.  
The `IRON_PASSWORD` variable can be set to anything as long as it is at minimum 32 characters long.

## Server Environment

The server environment is setup similar to the client. First, start by taking the `.example` off the end of [.env.example](/server/.env.example).

The only required fields to get the application running are the following:
```bash
IRON_PASSWORD = 32_character_long_password # required
```

Simply copy the `IRON_PASSWORD` variable from the client environment setup.

## Optional Environment

In the client there are various optional environment variables relating to setting up [Google](https://developers.google.com/identity/protocols/oauth2) and [Github](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps) OAuth. These are not required to run the application, but are required to use the OAuth login.
