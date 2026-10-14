terraform {
  required_version = ">= 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Local state on purpose: this stack creates the bucket every other stack keeps its state in.
  # It holds no secrets and is applied once by hand.
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.name
      Stack     = "bootstrap"
      ManagedBy = "terraform"
    }
  }
}
