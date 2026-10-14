variable "name" {
  description = "Name prefix for the node's resources"
  type        = string
}

variable "account_id" {
  description = "AWS account ID, used to scope the node's IAM policy"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_id" {
  description = "Public subnet for the node"
  type        = string
}

variable "instance_type" {
  description = "t3.small (2 GB) fits the app; t3.medium (4 GB) leaves room for heavier add-ons"
  type        = string
  default     = "t3.small"
}

variable "architecture" {
  description = "amd64 for t3 instances, arm64 for t4g"
  type        = string
  default     = "amd64"

  validation {
    condition     = contains(["amd64", "arm64"], var.architecture)
    error_message = "architecture must be amd64 or arm64."
  }
}

variable "volume_size_gb" {
  description = "Root volume size; it holds images, MySQL data and logs"
  type        = number
  default     = 30
}

variable "swap_gb" {
  type    = number
  default = 2
}

variable "k3s_version" {
  description = "Pinned k3s release, so a rebuild installs the same Kubernetes version"
  type        = string
}

variable "admin_cidrs" {
  description = "Addresses allowed to reach the Kubernetes API on 6443. Empty means use an SSM port forward instead"
  type        = list(string)
  default     = []
}

variable "secrets_path" {
  description = "SSM Parameter Store prefix the node may read, e.g. /rentsphere"
  type        = string
}

variable "backup_bucket_arn" {
  type = string
}

variable "bootstrap_script" {
  description = "Shell run at the end of first boot, after k3s is ready"
  type        = string
  default     = ""
}
