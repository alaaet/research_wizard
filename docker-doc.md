- Build/rebuild docker image:
```
docker build -t research-wizard-builder .
```

- Create docker container:
```
docker run --rm -v "$PWD:/app" -v "$PWD/dist:/app/dist" research-wizard-builder
```
