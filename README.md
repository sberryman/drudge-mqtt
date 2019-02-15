# Drudge Report via MQTT
Check popular news channel Drudgereport.com for news and publish the links
to a MQTT topic.

## Configuration
Controlled using environment variables.

### Defaults
```shell
# Logging
LOG_LEVEL=warning

# Polling
POLL_ON_INIT=true
REFRESH_RATE=60 # how frequently to poll in seconds, min=60

# Database/Persistence (sqlite)
DB_PATH=""
```

## Development
I prefer to keep my environment clean, all development happens within a docker
container.

Start up a docker container:
```shell
docker run -it --rm \
  -v "$PWD":/app \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  node:lts \
  /bin/bash
```
* Force running container using the currently logged in user. This will allow
  you to edit files from the host without running into permissions issues.

Install dependencies:
```shell
cd /app
npm install
npm run watch
```

### Local testing
Adjust the development `REQ_URL` to a locally hosted version. There are several
samples saved as part of this repo.

```shell
REQ_URL = "http://{local_ip}:8097/test/source/2019_02_14_0.html"
```

Python v2:
```shell
cd python3 -m SimpleHTTPServer 8097
```

Python v3:
```shell
python3 -m http.server 8097
```

## Deployment
Coming soon (via docker)
