# EtherCalc Helm chart

Helm chart for self-hosting [EtherCalc](https://ethercalc.net/) on Kubernetes.

## Install

```bash
helm install my-ethercalc ./helm
```

Or with overrides:

```bash
helm install my-ethercalc ./helm \
  --set config.cors=true \
  --set secrets.key="$(openssl rand -hex 32)" \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ethercalc.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

## Why this chart is single-replica

EtherCalc's self-host image runs a single `workerd serve` process that
owns all Durable Object state locally under `/data`. Two pods sharing
the same PVC will corrupt rooms silently — Miniflare has no consensus
layer, so a second writer can overwrite the first's view of a sheet
with no conflict detection. The chart enforces `replicas: 1` and
`strategy: Recreate`.

If you need horizontal scale, deploy to **Cloudflare Workers + Durable
Objects** via `wrangler deploy` — DO placement gives you per-room
consistency automatically. See the repo-root `README.md` for that
path.

## Configuration

See `values.yaml` for the full list. Common overrides:

| Key                      | Default                  | Effect                                                |
| ------------------------ | ------------------------ | ----------------------------------------------------- |
| `image.tag`              | (Chart.yaml appVersion)  | Pin to a specific EtherCalc release.                  |
| `persistence.enabled`    | `true`                   | Provision a PVC at `/data`.                           |
| `persistence.size`       | `10Gi`                   | PVC size.                                             |
| `persistence.storageClass` | `""` (cluster default) | Override storage class.                               |
| `config.basepath`        | `""`                     | URL prefix when behind a reverse proxy.               |
| `config.cors`            | `false`                  | Enable CORS.                                          |
| `config.defaultRoom`     | `""`                     | Redirect `/` to this room.                            |
| `config.expire`          | `""`                     | Seconds before inactive rooms are pruned.             |
| `secrets.key`            | `""`                     | HMAC key for read-only vs. edit auth.                 |
| `secrets.migrateToken`   | `""`                     | Gates `PUT /_migrate/seed/:room`.                     |
| `ingress.enabled`        | `false`                  | Create an Ingress resource.                           |

## Upgrading

```bash
helm upgrade my-ethercalc ./helm
```

The PVC is annotated `helm.sh/resource-policy: keep`, so data survives
`helm uninstall`. To delete data explicitly:

```bash
kubectl delete pvc <release-name>
```
