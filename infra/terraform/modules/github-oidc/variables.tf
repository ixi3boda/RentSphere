variable "name" {
  description = "Name prefix shared by the stack's resources"
  type        = string
}

variable "github_repository" {
  description = "owner/repo allowed to assume the roles"
  type        = string
}

variable "state_bucket_arn" {
  type = string
}
