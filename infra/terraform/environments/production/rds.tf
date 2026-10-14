# Optional managed MySQL. Off by default: the in-cluster StatefulSet costs nothing extra, while
# db.t4g.micro adds ~$12/month against the credits. Turn on with enable_rds = true.

resource "aws_db_subnet_group" "this" {
  count = var.enable_rds ? 1 : 0

  name       = "${var.name}-db"
  subnet_ids = module.network.public_subnet_ids
}

resource "aws_security_group" "db" {
  count = var.enable_rds ? 1 : 0

  name        = "${var.name}-db"
  description = "MySQL from the k3s node only"
  vpc_id      = module.network.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "db_from_node" {
  count = var.enable_rds ? 1 : 0

  security_group_id            = aws_security_group.db[0].id
  referenced_security_group_id = module.node.security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}

resource "aws_db_instance" "this" {
  count = var.enable_rds ? 1 : 0

  identifier     = "${var.name}-db"
  engine         = "mysql"
  engine_version = "8.4"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "RentSphereSchema"
  username = "rentsphere"
  # Write-only: the password is set in AWS but never stored in the state
  password_wo         = ephemeral.random_password.mysql.result
  password_wo_version = var.secrets_version

  db_subnet_group_name   = aws_db_subnet_group.this[0].name
  vpc_security_group_ids = [aws_security_group.db[0].id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false
  apply_immediately       = true
}
