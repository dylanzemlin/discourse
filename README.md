# Discourse

[Discourse](https://discourse.dylanzeml.in/) is a single channel voice application made for CS 3202 (Software Engineering) at the University of Oklahoma. Its primary purpose is to allow users to talk to eachother and have fun while avoiding the need to create channels and servers.

## Authors

 - [Dylan Zemlin](https://github.com/dylanzemlin/) (<dylan.zemlin@ou.edu>) | Full Stack Developer
 - [Jacob Pierce](https://github.com/pier116) (<jacob.pierce@ou.edu>) | Full Stack Developer
 - [Aayush Dalal](https://github.com/) (<aayush.dalal@ou.edu>) | Project Manager
## Requirements

Below are the requirements and the versions we ran our tests on. We cannot guarantee that the application will work on other versions.

  - [NodeJS](https://nodejs.org/en/) v19.2.0
  - [NPM](https://www.npmjs.com/) v9.1.3
  - [Yarn](https://classic.yarnpkg.com/) v1.22.19

## Running

First start by following the instructions in the [environment.md](./docs/environment.md) file to set up your local environment.

Then, open up two terminals or in a pure terminal environment, prepare two different screens/sessions.

In the first terminal, run the following commands:

```bash
cd client
yarn
yarn dev
```

In the second terminal, run the following commands:

```bash
cd server
yarn
yarn dev
```

The actual client and website to visit will be hosted at http://localhost:3000.

## 3rd Party Libraries

Below is a list of third party packages/libraries used throughout the project. There are more, but these are big ones, the rest can be found in both `package.json` files.

  - [Next.js](https://nextjs.org/) - React framework
  - [React](https://reactjs.org/) - Frontend library
  - [Mantine](https://mantine.dev/) - React UI library
  - [Iron Session](https://github.com/vvo/iron-session) - Session management
  - [ws](https://www.npmjs.com/package/ws) - Serverside websocket library
  - [bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing
  - [pocketbase](https://pocketbase.io/) - Database
  - [simple-peer](https://github.com/feross/simple-peer) - WebRTC helper library
