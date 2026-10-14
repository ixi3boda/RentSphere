terraform {
  required_version = ">= 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }

  # The bucket name includes the account ID, so it is passed at init time:
  #   terraform init -backend-config="bucket=$(terraform -chdir=../../bootstrap output -raw state_bucket)"
  backend "s3" {
    key          = "production/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.name
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}
