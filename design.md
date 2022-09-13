# Design Document

This document contains all the information needed for the design of Discourse.  
**Bolded items are final decisions.**

## Frontend Frameworks

 - React: The benefit of react is its component system and availability for backend frameworks like NextJS. However, the learning curve for it can be quite steep.
 - Angular: I (Dylan) have no idea how to use angular or what it even is, so this could be fun for just messing with our options.
 - Plain: HTML/(S)CSS/JS can never go wrong. It is simple, yet insanely customizable.
 - Other: There are likely other options that exist we can explore if the opportunity arises.

## Backend Framework

The backend framework mainly depends on what we use for the frontend.  

 - NextJS: This option is fantastic if we choose React, as it contains code for the frontend, backend and use existing middleware.
 - Express: This option is great if we choose Plain, as it allows us to host our own files, create backend code and use existing middleware.

## Shared Frameworks

 - Auth0: A auth management framework that handles authorization and authentication for us. It is free, easy to use and should be perfect for this project. It is backend/frontend framework agnostic.
 - Firebase/MongoDB: The database we choose does not necessarily matter, as long as its free for our use and relatively easy to use.
 - Typescript: Using a typing system will help reduce development bugs, as javascript has almost zero type safety by default.

## Hosting

I (Dylan) can handle the hosting by slapping it onto a subdomain of my website. The final URL will probably end up being https://discourse.dylanzeml.in/ if we go with that.  
The website contents itself depends on what framework we use, as companies like Vercel can host our websites code for free if we use something like NextJS.

## Resources

 - [WebRTC Example](https://github.com/Dirvann/webrtc-video-conference-simple-peer): This repository has a great example of how to make WebRTC work with a single server. This uses SocketIO and WebRTC, which is fantastic if we decide to go any further and add other features like chat.
 - [WebRTC Documentation](https://webrtc.org/): Pure documentation for WebRTC.
 - [NextJS](https://nextjs.org/) and [React](https://reactjs.org/): Links to both NextJS and React for learning.
 - [Vercel](https://vercel.com/): If we write the application using NextJS/React, this will probably be what hosts our website. Although, it could cause some SocketIO problems (needs to be researched).
 - [Angular](https://angular.io/) and [Angular Universal](https://angular.io/guide/universal): Links to Angular and Angular Universal, basically the same thing as above but for angular.
 - [Express](https://expressjs.com/): ExpressJS documentation, this will be helpful if we go the plain HTML/CSS/JS route.
 - [Firebase](https://firebase.google.com/): The documentation and website for Firebase.
 - [MongoDB](https://www.mongodb.com/): The documentation and website for MongoDB.
 - [Auth0](https://auth0.com/) and [Auth0 Example](https://github.com/dylanzemlin/FinancialPlanner): The website for Auth0, and an repository in which its been used before to get some ideas.
 - [Typescript](https://www.typescriptlang.org/): If possible, using typescript will drastically help with development and preventing bugs
