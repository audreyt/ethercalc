Helm Chart for EtherCalc
========================

## Summary

This chart creates a EtherCalc deployment on a Kubernetes cluster using the Helm package manager.

## Prerequisites

This chart has been created with Helm v3. To use it ensure the following prerequisites are fullfilled :

- Kubernetes 1.9+
- Helm v3

## Installing the Chart

To install the chart with the release name `my-release`:

```bash
$ helm repo add crivaledaz http://clavier.iiens.net/helm
$ helm install my-release crivaledaz/ethercalc
```

The command deploys EtherCalc on the Kubernetes cluster in the default configuration. The configuration section lists the parameters that can be configured during installation.

## Unnstalling the Chart

To uninstall/delete the `my-release` deployment:

```bash
$ helm delete my-release
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Configuration

The following table lists the configurable parameters of the EtherCacl chart and their default values.

| Parameter                     | Description                                                                   | Default                              |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------ |
| `service.type`                | Service type                                                                  | `ClusterIP`                          |
| `service.port`                | EtherCalc exposed port                                                        | `80`                                 |
| `ingress.annotations`         | Specify ingress class                                                         | `kubernetes.io/ingress.class: nginx` |
| `ingress.enabled`             | Enable ingress controller resource                                            | `false`                              |
| `ingress.hosts.paths`         | Paths to match against incoming requests.                                     | `'/'`                                | 
| `ingress.hosts`               | Application hostnames                                                         | `ethercalc.local`                    |
| `ingress.tls`                 | Ingress TLS configuration                                                     | `[]`                                 |
| `persistence.data.enabled`    | Enable data persistence using a PVC                                           | `false`                              |
| `persistence.data.size`       | PVC size for data persistence                                                 | `1Gi`                                |
| `persistence.data.accessMode` | Access mode for the PersistentVolumeClaim                                     | `ReadWriteOnce`                      |
| `ethercalc.image.repository`  | Container image repository for EtherCalc                                      | `audreyt/ethercalc`                  |
| `ethercalc.image.pullPolicy`  | Container image pull policy for Ethercalc                                     | `IfNotPresent`                       |
| `ethercalc.image.tag`         | Container image pull policy for Ethercalc                                     | `latest`                             |
| `redis.image.repository`      | Container image repository for Redis                                          | `redis`                              |
| `redis.image.pullPolicy`      | Container image pull policy for Redis                                         | IfNotPresent                         |
| `redis.image.tag`             | Container image pull policy for Redis                                         | `latest`                             |
| `ressources`                  | Pod resource requests & limits                                                | `{}`                                 |
| `nodeSelector`                | Node labels for pod assignment                                                | `{}`                                 |
| `toleration`                  | List of node taints to tolerate                                               | `[]`                                 |
| `affinity`                    | Affinity for pod assignment                                                   | `{}`                                 |
| `replicaCount`                | Number of replicas                                                            | `1`                                  |
| `nameOverride`                | Override the release name for object created by Helm                          | `""`                                 |
| `fullnameOverride`            | Override the fullname for object created by Helm                              | `""`                                 |
| `serviceAccount.create`       | Whether a new service account name that the agent will use should be created. | `true`                               |
| `serviceAccount.name`         | Service account to be used.                                                   |                                      |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```bash
$ helm install my-release \
  --set replicaCount=2 \
  --set service.port=8080 \
  crivaledaz/ethercalc
```

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```bash
$ helm install my-release -f values.yaml crivaledaz/ethercalc
```
