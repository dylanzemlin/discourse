# Pocketbase Setup

Pocketbase is the designated database for Discourse as it is extremely simple to setup! The [https://pocketbase.io/docs/](following) instructions will walk you through the process of setting up your own Pocketbase database locally.

## Pocketbase Credentials

When you have hosted your pocketbase application, visit your [admin dashboard](http://127.0.0.1:8090/_/) typically hosted at http://127.0.0.1:8090/_/. From there, click the settings icon on the navigation bar  
![alt text](/docs/assets/pb_settings_icon.png)

Next, click the admins tab under authentication  
![alt text](/docs/assets/pb_admins.png)

From there, click the **New admin** button seen on the top right, and enter a email/password of your choice. It does not need to be a real email. The email/password you enter here will be used in the environment setup. Furthermore, the url you used to get here will also be used in the environment, for example: http://127.0.0.1:8090/ (**IMPORTANT** do not including the trailing `_/` in your environment variable)  

## Collections

Upon first launching, the client backend will automaticlly create the required collections.
