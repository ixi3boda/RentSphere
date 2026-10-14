output "public_ip" {
  value = module.node.public_ip
}

output "hostname" {
  description = "Set this as HOSTNAME in k8s/overlays/aws/cluster.env"
  value       = local.hostname
}

output "url" {
  value = "https://${local.hostname}"
}

output "instance_id" {
  value = module.node.instance_id
}

output "backup_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "shell" {
  description = "Open a shell on the node (no SSH key or open port needed)"
  value       = "aws ssm start-session --target ${module.node.instance_id} --region ${var.region}"
}

output "rds_endpoint" {
  value = var.enable_rds ? aws_db_instance.this[0].address : null
}
