SHELL := bash

CLUSTER   := rentsphere
NAMESPACE := rentsphere
LOCAL     := k8s/overlays/local
SECRETS   := $(LOCAL)/secrets.env

TRAEFIK_CHART_VERSION        := 41.7.1
METRICS_SERVER_CHART_VERSION := 3.14.0

.PHONY: help kind-up kind-secrets kind-images kind-deploy kind kind-down k8s-validate

help: ## List the targets
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-16s %s\n", $$1, $$2}'

kind-up: ## Create the kind cluster with Traefik and metrics-server
	kind get clusters | grep -qx $(CLUSTER) || kind create cluster --config k8s/kind/cluster.yaml
	helm upgrade --install traefik traefik --repo https://traefik.github.io/charts \
	  --version $(TRAEFIK_CHART_VERSION) --namespace traefik --create-namespace \
	  --values k8s/kind/traefik-values.yaml --wait
	helm upgrade --install metrics-server metrics-server --repo https://kubernetes-sigs.github.io/metrics-server/ \
	  --version $(METRICS_SERVER_CHART_VERSION) --namespace kube-system \
	  --set 'args={--kubelet-insecure-tls}' --wait

kind-secrets: ## Generate random local secrets (kept out of git)
	@test -f $(SECRETS) || { \
	  printf 'MYSQL_PASSWORD=%s\nMYSQL_ROOT_PASSWORD=%s\nJWT_SECRET=%s\nPAYPAL_CLIENT_ID=sandbox-placeholder\nPAYPAL_CLIENT_SECRET=sandbox-placeholder\n' \
	    "$$(openssl rand -hex 16)" "$$(openssl rand -hex 16)" "$$(openssl rand -hex 32)" > $(SECRETS); \
	  echo "Wrote $(SECRETS)"; }

kind-images: ## Build both images and load them into the cluster
	docker build -t rentsphere-backend:local Backend
	docker build -t rentsphere-frontend:local Frontend
	kind load docker-image rentsphere-backend:local rentsphere-frontend:local --name $(CLUSTER)

kind-deploy: kind-secrets ## Apply the local overlay and wait for the rollout
	kubectl apply -k $(LOCAL)
	kubectl -n $(NAMESPACE) rollout status statefulset/mysql --timeout=5m
	kubectl -n $(NAMESPACE) rollout status deployment/backend --timeout=5m
	kubectl -n $(NAMESPACE) rollout status deployment/frontend --timeout=2m
	@echo "RentSphere is up at http://rentsphere.localhost:8088"

kind: kind-up kind-images kind-deploy ## Everything: cluster, images, app

kind-down: ## Delete the kind cluster
	kind delete cluster --name $(CLUSTER)

k8s-validate: ## Render every overlay and validate it against the Kubernetes schemas
	@for overlay in k8s/overlays/*/; do \
	  echo "== $$overlay"; \
	  out=$$(kubectl kustomize $$overlay) || exit 1; \
	  echo "$$out" | kubeconform -strict -summary -ignore-missing-schemas -kubernetes-version 1.33.0 - || exit 1; \
	done
