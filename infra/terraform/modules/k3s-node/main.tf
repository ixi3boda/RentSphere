# One EC2 instance running k3s, a certified Kubernetes distribution that fits on a small node.
# It replaces EKS, whose control plane alone costs about $73 a month. There is no SSH: the
# instance is reached through SSM Session Manager.

data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/${var.architecture}/hvm/ebs-gp3/ami-id"
}

data "aws_region" "current" {}

resource "aws_security_group" "node" {
  name        = "${var.name}-node"
  description = "k3s node: HTTP and HTTPS from anywhere, Kubernetes API from admin addresses only"
  vpc_id      = var.vpc_id

  tags = { Name = "${var.name}-node" }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.node.id
  description       = "HTTP, for the Let's Encrypt challenge and the redirect to HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.node.id
  description       = "HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "kube_api" {
  for_each = toset(var.admin_cidrs)

  security_group_id = aws_security_group.node.id
  description       = "Kubernetes API"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 6443
  to_port           = 6443
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.node.id
  description       = "Image pulls, OS updates, AWS APIs, PayPal"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ---- IAM: SSM access, the node's secrets and the backup bucket ----

data "aws_iam_policy_document" "assume_ec2" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${var.name}-node"
  assume_role_policy = data.aws_iam_policy_document.assume_ec2.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "node" {
  statement {
    sid       = "ReadAppSecrets"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${data.aws_region.current.region}:${var.account_id}:parameter${var.secrets_path}/*"]
  }

  statement {
    sid       = "WriteBackups"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${var.backup_bucket_arn}/*"]
  }

  statement {
    sid       = "ListBackups"
    actions   = ["s3:ListBucket"]
    resources = [var.backup_bucket_arn]
  }
}

resource "aws_iam_role_policy" "node" {
  name   = "${var.name}-node"
  role   = aws_iam_role.node.id
  policy = data.aws_iam_policy_document.node.json
}

resource "aws_iam_instance_profile" "node" {
  name = "${var.name}-node"
  role = aws_iam_role.node.name
}

# ---- Instance ----

# Allocated before the instance so its address can go into the API server certificate
resource "aws_eip" "node" {
  domain = "vpc"

  tags = { Name = var.name }
}

resource "aws_instance" "node" {
  ami                    = data.aws_ssm_parameter.ubuntu_ami.value
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.node.id]
  iam_instance_profile   = aws_iam_instance_profile.node.name

  user_data_replace_on_change = true
  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    k3s_version = var.k3s_version
    public_ip   = aws_eip.node.public_ip
    swap_gb     = var.swap_gb
    bootstrap   = var.bootstrap_script
  })

  metadata_options {
    http_tokens = "required"
    # 2 hops so pods (one network hop further) can use the node role, e.g. for backups
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.volume_size_gb
    encrypted             = true
    delete_on_termination = true
  }

  credit_specification {
    # "unlimited" can bill for CPU surplus credits; standard caps the burst instead
    cpu_credits = "standard"
  }

  tags = { Name = var.name }

  lifecycle {
    # A newer Ubuntu image should not replace the node on the next apply
    ignore_changes = [ami]
  }
}

resource "aws_eip_association" "node" {
  instance_id   = aws_instance.node.id
  allocation_id = aws_eip.node.id
}
