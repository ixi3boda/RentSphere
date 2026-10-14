SHELL := bash

CLUSTER   := rentsphere
NAMESPACE := rentsphere
LOCAL     := k8s/overlays/local
SECRETS   := $(LOCAL)/secrets.env

TF_PROD := infra/terraform/environments/production

TRAEFIK_CHART_VERSION        := 41.7.1
METRICS_SERVER_CHART_VERSION := 3.14.0
KPS_CHART_VERSION            := 92.7.0
LOKI_CHART_VERSION           := 7.3.0
TEMPO_CHART_VERSION          := 1.24.4
ALLOY_CHART_VERSION          := 1.13.1
GRAFANA_CHARTS               := https://grafana.github.io/helm-charts

.PHONY: help kind-up kind-secrets kind-images kind-deploy kind kind-down k8s-validate kind-monitoring kind-observability aws-config aws-kubeconfig db-backup db-backups db-restore

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
	@# Same tag, new image: restart running pods so they pick it up
	@kubectl -n $(NAMESPACE) rollout restart deployment/backend deployment/frontend 2>/dev/null || true

kind-deploy: kind-secrets ## Apply the local overlay and wait for the rollout
	kubectl apply -k $(LOCAL)
	kubectl -n $(NAMESPACE) rollout status statefulset/mysql --timeout=5m
	kubectl -n $(NAMESPACE) rollout status deployment/backend --timeout=5m
	kubectl -n $(NAMESPACE) rollout status deployment/frontend --timeout=2m
	@echo "RentSphere is up at http://rentsphere.localhost:8088"

kind-monitoring: ## Install Prometheus, Alertmanager and Grafana (http://grafana.localhost:8088)
	kubectl get namespace monitoring >/dev/null 2>&1 || kubectl create namespace monitoring
	kubectl -n monitoring get secret grafana-admin >/dev/null 2>&1 || \
	  kubectl -n monitoring create secret generic grafana-admin \
	    --from-literal=admin-user=admin --from-literal=admin-password="$$(openssl rand -hex 12)"
	helm upgrade --install monitoring kube-prometheus-stack --repo https://prometheus-community.github.io/helm-charts \
	  --version $(KPS_CHART_VERSION) --namespace monitoring \
	  --values k8s/monitoring/kube-prometheus-stack.values.yaml --wait --timeout 10m
	@echo "Grafana: http://grafana.localhost:8088  user admin, password:"
	@kubectl -n monitoring get secret grafana-admin -o jsonpath='{.data.admin-password}' | base64 -d; echo

kind-observability: kind-monitoring ## Add Loki (logs), Tempo (traces) and the Alloy collector
	helm upgrade --install loki loki --repo $(GRAFANA_CHARTS) --version $(LOKI_CHART_VERSION) \
	  --namespace monitoring --values k8s/monitoring/loki.values.yaml --wait --timeout 10m
	helm upgrade --install tempo tempo --repo $(GRAFANA_CHARTS) --version $(TEMPO_CHART_VERSION) \
	  --namespace monitoring --values k8s/monitoring/tempo.values.yaml --wait --timeout 10m
	kubectl apply -k k8s/monitoring/local
	helm upgrade --install alloy alloy --repo $(GRAFANA_CHARTS) --version $(ALLOY_CHART_VERSION) \
	  --namespace monitoring --values k8s/monitoring/alloy.values.yaml --wait --timeout 5m
	kubectl -n monitoring rollout restart daemonset/alloy

kind: kind-up kind-images kind-deploy ## Everything: cluster, images, app

kind-down: ## Delete the kind cluster
	kind delete cluster --name $(CLUSTER)

# Kubernetes schemas, plus a community catalog for CRDs (Traefik, Argo CD, cert-manager, ...)
CRD_SCHEMAS := https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json

k8s-validate: ## Render every kustomization and validate it against the Kubernetes and CRD schemas
	@for dir in k8s/overlays/*/ k8s/platform k8s/argocd/apps; do \
	  echo "== $$dir"; \
	  out=$$(kubectl kustomize $$dir) || exit 1; \
	  echo "$$out" | kubeconform -strict -summary -ignore-missing-schemas -kubernetes-version 1.33.0 \
	    -schema-location default -schema-location '$(CRD_SCHEMAS)' - || exit 1; \
	done

aws-config: ## Write the Terraform outputs into k8s/overlays/aws/cluster.env (commit it afterwards)
	@printf '# Generated by `make aws-config` from the Terraform outputs\nHOSTNAME=%s\nBACKUP_BUCKET=%s\n' \
	  "$$(terraform -chdir=$(TF_PROD) output -raw hostname)" \
	  "$$(terraform -chdir=$(TF_PROD) output -raw backup_bucket)" > k8s/overlays/aws/cluster.env
	@cat k8s/overlays/aws/cluster.env

aws-kubeconfig: ## Tunnel the Kubernetes API through SSM to localhost:6443 and write ~/.kube/rentsphere-aws
	@id=$$(terraform -chdir=$(TF_PROD) output -raw instance_id); \
	cmd=$$(aws ssm send-command --instance-ids $$id --document-name AWS-RunShellScript \
	  --parameters 'commands=["cat /etc/rancher/k3s/k3s.yaml"]' --query Command.CommandId --output text); \
	aws ssm wait command-executed --command-id $$cmd --instance-id $$id; \
	aws ssm get-command-invocation --command-id $$cmd --instance-id $$id --query StandardOutputContent --output text \
	  > $$HOME/.kube/rentsphere-aws; chmod 600 $$HOME/.kube/rentsphere-aws; \
	echo "export KUBECONFIG=$$HOME/.kube/rentsphere-aws  (keep this tunnel open)"; \
	aws ssm start-session --target $$id --document-name AWS-StartPortForwardingSession \
	  --parameters '{"portNumber":["6443"],"localPortNumber":["6443"]}'

# ---- Database backups (run against the current kube context, e.g. after make aws-kubeconfig) ----

db-backup: ## Take a backup now, from the nightly CronJob's template
	@job=mysql-backup-manual-$$(date +%s); \
	kubectl -n $(NAMESPACE) create job --from=cronjob/mysql-backup $$job; \
	kubectl -n $(NAMESPACE) wait --for=condition=complete job/$$job --timeout=15m; \
	kubectl -n $(NAMESPACE) logs job/$$job -c upload

db-backups: ## List the backups in S3
	@kubectl -n $(NAMESPACE) run backup-list-$$(date +%s) --rm -i --restart=Never --quiet \
	  --image=amazon/aws-cli:2.38.1 --env=HOME=/tmp --overrides='{"spec":{"automountServiceAccountToken":false,"securityContext":{"runAsNonRoot":true,"runAsUser":65534,"seccompProfile":{"type":"RuntimeDefault"}},"containers":[{"name":"list","image":"amazon/aws-cli:2.38.1","args":["s3","ls","s3://'"$$(kubectl -n $(NAMESPACE) get configmap cluster-config -o jsonpath='{.data.BACKUP_BUCKET}')"'/mysql/"],"env":[{"name":"HOME","value":"/tmp"}],"securityContext":{"allowPrivilegeEscalation":false,"capabilities":{"drop":["ALL"]}}}]}}'

db-restore: ## Restore BACKUP=<file name> (default: the newest backup) into MySQL
	@job=$$(sed 's|$${BACKUP_KEY}|$(BACKUP)|' k8s/jobs/mysql-restore.yaml | kubectl create -f - -o name); \
	echo "$$job"; \
	kubectl -n $(NAMESPACE) wait --for=condition=complete $$job --timeout=15m; \
	kubectl -n $(NAMESPACE) logs $$job -c download; kubectl -n $(NAMESPACE) logs $$job -c restore
