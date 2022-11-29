from flask import Flask, Response
import os


app = Flask(__name__)
client_name = "discourse_client"
server_name = "discourse_server"


@app.route('/update', methods=['GET', 'POST'])
def update():
    # Pull latest updates
    os.system("git pull")

    # Rebuild the projects and wait for it to finish
    os.system("cd ../client && yarn && yarn build")
    os.system("cd ../server && yarn")

    # Tell PM2 to restart the processes
    os.system("pm2 restart " + client_name)
    os.system("pm2 restart " + server_name)

    return Response("Updated and restarted", status=200)

if __name__ == '__main__':
    app.run(host='localhost', port=3002)