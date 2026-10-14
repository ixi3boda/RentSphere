variable "name" {
  description = "Name prefix for the VPC resources"
  type        = string
}

variable "cidr_block" {
  description = "VPC address range"
  type        = string
  default     = "10.20.0.0/16"
}

variable "subnet_count" {
  description = "Public subnets to create, one per availability zone (RDS needs at least two)"
  type        = number
  default     = 2

  validation {
    condition     = var.subnet_count >= 2 && var.subnet_count <= 3
    error_message = "Use 2 or 3 subnets."
  }
}
