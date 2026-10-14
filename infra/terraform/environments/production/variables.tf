variable "name" {
  type    = string
  default = "rentsphere"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "k3s_version" {
  type    = string
  default = "v1.36.5+k3s1"
}

variable "admin_cidrs" {
  description = "Your public IP as x.x.x.x/32 to reach the Kubernetes API directly; leave empty to use SSM"
  type        = list(string)
  default     = []
}

variable "hostname" {
  description = "Public hostname; defaults to <elastic-ip>.sslip.io"
  type        = string
  default     = ""
}

variable "backup_retention_days" {
  type    = number
  default = 14
}

variable "secrets_version" {
  description = "Increase to generate and store new database and JWT secrets"
  type        = number
  default     = 1
}

variable "paypal_client_id" {
  description = "PayPal sandbox client ID"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "paypal_client_secret" {
  description = "PayPal sandbox client secret"
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "enable_rds" {
  description = "Use RDS MySQL instead of the in-cluster StatefulSet"
  type        = bool
  default     = false
}
