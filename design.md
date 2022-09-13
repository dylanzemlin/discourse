# Design Document

This document contains all the information needed for the design of Discourse.

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

## Hosting

I (Dylan) can handle the hosting by slapping it onto a subdomain of my website. The final URL will probably end up being https://discourse.dylanzeml.in/ if we go with that.  
The website contents itself depends on what framework we use, as companies like Vercel can host our websites code for free if we use something like NextJS.
