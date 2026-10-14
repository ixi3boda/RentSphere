output "state_bucket" {
  description = "Pass to `terraform init -backend-config=bucket=...` in environments/production"
  value       = aws_s3_bucket.state.bucket
}

output "github_plan_role_arn" {
  description = "Repository variable AWS_PLAN_ROLE_ARN"
  value       = module.github_oidc.plan_role_arn
}

output "github_apply_role_arn" {
  description = "Repository variable AWS_APPLY_ROLE_ARN"
  value       = module.github_oidc.apply_role_arn
}
