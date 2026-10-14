data "aws_caller_identity" "current" {}

locals {
  secrets_path = "/${var.name}/production"
  # sslip.io resolves 1-2-3-4.sslip.io to 1.2.3.4, which gives Let's Encrypt a hostname
  # without buying a domain
  hostname = coalesce(var.hostname, "${replace(module.node.public_ip, ".", "-")}.sslip.io")
}

module "network" {
  source = "../../modules/network"

  name = var.name
}

module "node" {
  source = "../../modules/k3s-node"

  name              = var.name
  account_id        = data.aws_caller_identity.current.account_id
  vpc_id            = module.network.vpc_id
  subnet_id         = module.network.public_subnet_ids[0]
  instance_type     = var.instance_type
  k3s_version       = var.k3s_version
  admin_cidrs       = var.admin_cidrs
  secrets_path      = local.secrets_path
  backup_bucket_arn = aws_s3_bucket.backups.arn

  bootstrap_script = templatefile("${path.module}/bootstrap-cluster.sh.tftpl", {
    repository = var.github_repository
  })
}

# ---- Database backups ----

resource "aws_s3_bucket" "backups" {
  bucket = "${var.name}-backups-${data.aws_caller_identity.current.account_id}"

  # Backups are disposable demo data; let `terraform destroy` remove them
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-backups"
    status = "Enabled"

    filter {}

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# ---- Application secrets ----
# Stored in SSM Parameter Store (standard tier, free) and read by the cluster. The values are
# write-only, so they never appear in the Terraform state; bump secrets_version to rotate them.

ephemeral "random_password" "mysql" {
  length  = 32
  special = false
}

ephemeral "random_password" "mysql_root" {
  length  = 32
  special = false
}

ephemeral "random_password" "jwt" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "mysql_password" {
  name             = "${local.secrets_path}/MYSQL_PASSWORD"
  type             = "SecureString"
  value_wo         = ephemeral.random_password.mysql.result
  value_wo_version = var.secrets_version
}

resource "aws_ssm_parameter" "mysql_root_password" {
  name             = "${local.secrets_path}/MYSQL_ROOT_PASSWORD"
  type             = "SecureString"
  value_wo         = ephemeral.random_password.mysql_root.result
  value_wo_version = var.secrets_version
}

resource "aws_ssm_parameter" "jwt_secret" {
  name             = "${local.secrets_path}/JWT_SECRET"
  type             = "SecureString"
  value_wo         = ephemeral.random_password.jwt.result
  value_wo_version = var.secrets_version
}

resource "aws_ssm_parameter" "paypal_client_id" {
  name             = "${local.secrets_path}/PAYPAL_CLIENT_ID"
  type             = "SecureString"
  value_wo         = var.paypal_client_id
  value_wo_version = var.secrets_version
}

resource "aws_ssm_parameter" "paypal_client_secret" {
  name             = "${local.secrets_path}/PAYPAL_CLIENT_SECRET"
  type             = "SecureString"
  value_wo         = var.paypal_client_secret
  value_wo_version = var.secrets_version
}
