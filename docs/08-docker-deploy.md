# Docker Deploy (Nginx, Port 3456)

## Run the app in Docker

From the repo root:

```bash
docker compose up -d --build
```

The app will be reachable at:

- `http://127.0.0.1:3456`

## Stop / restart

```bash
docker compose down
docker compose up -d
```

## Host Nginx stub for `rocket.finality.dev`

Use this file as a template on the host machine:

- `deploy/nginx/rocket.finality.dev.conf.example`

Typical flow:

1. Copy it to your host Nginx sites config path.
2. Enable the site.
3. Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Then DNS for `rocket.finality.dev` should point to that host.
