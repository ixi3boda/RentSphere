variable "name" {
  type    = string
  default = "rentsphere"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "alert_email" {
  description = "Where the budget alerts go"
  type        = string
}

variable "monthly_budget_usd" {
  description = "Alert threshold. The stack is sized to run on Free plan credits, so any real spend is a surprise"
  type        = string
  default     = "1"
}

variable "github_repository" {
  type    = string
  default = "ixi3boda/RentSphere"
}
