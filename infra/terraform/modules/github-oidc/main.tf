# Lets GitHub Actions call AWS with short-lived credentials, so no access key is stored in
# GitHub. The plan role is read-only; the apply role is only available to jobs running in the
# protected "production" environment.

data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

locals {
  repo = "repo:${var.github_repository}"
}

data "aws_iam_policy_document" "assume_plan" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${local.repo}:ref:refs/heads/main", "${local.repo}:pull_request"]
    }
  }
}

data "aws_iam_policy_document" "assume_apply" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${local.repo}:environment:production"]
    }
  }
}

# Both roles read and lock the state file
data "aws_iam_policy_document" "state" {
  statement {
    actions   = ["s3:ListBucket"]
    resources = [var.state_bucket_arn]
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${var.state_bucket_arn}/*"]
  }
}

resource "aws_iam_role" "plan" {
  name               = "${var.name}-github-plan"
  assume_role_policy = data.aws_iam_policy_document.assume_plan.json
}

resource "aws_iam_role_policy_attachment" "plan_read_only" {
  role       = aws_iam_role.plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "plan_state" {
  name   = "terraform-state"
  role   = aws_iam_role.plan.id
  policy = data.aws_iam_policy_document.state.json
}

resource "aws_iam_role" "apply" {
  name               = "${var.name}-github-apply"
  assume_role_policy = data.aws_iam_policy_document.assume_apply.json
}

resource "aws_iam_role_policy_attachment" "apply_read_only" {
  role       = aws_iam_role.apply.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "apply_state" {
  name   = "terraform-state"
  role   = aws_iam_role.apply.id
  policy = data.aws_iam_policy_document.state.json
}

# Write access limited to what the production stack manages, and to resources named after it
data "aws_iam_policy_document" "apply" {
  statement {
    sid       = "Compute"
    actions   = ["ec2:*"]
    resources = ["*"]
  }
  statement {
    sid       = "Buckets"
    actions   = ["s3:CreateBucket", "s3:DeleteBucket", "s3:Get*", "s3:List*", "s3:Put*", "s3:DeleteObject*"]
    resources = ["arn:aws:s3:::${var.name}-*", "arn:aws:s3:::${var.name}-*/*"]
  }
  statement {
    sid     = "NodeRole"
    actions = ["iam:*"]
    resources = [
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.name}-node",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:instance-profile/${var.name}-node",
    ]
  }
  statement {
    sid       = "Parameters"
    actions   = ["ssm:PutParameter", "ssm:DeleteParameter", "ssm:AddTagsToResource", "ssm:RemoveTagsFromResource"]
    resources = ["arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/${var.name}/*"]
  }
  statement {
    sid       = "Database"
    actions   = ["rds:*"]
    resources = ["arn:aws:rds:*:${data.aws_caller_identity.current.account_id}:*:${var.name}-*"]
  }
  statement {
    sid       = "RdsServiceRole"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["arn:aws:iam::*:role/aws-service-role/rds.amazonaws.com/*"]
  }
}

resource "aws_iam_role_policy" "apply" {
  name   = "production-stack"
  role   = aws_iam_role.apply.id
  policy = data.aws_iam_policy_document.apply.json
}
