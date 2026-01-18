terraform {
  required_providers {
    scaleway = {
      source = "scaleway/scaleway"
    }
  }
  required_version = ">= 0.13"
}

#Ici nous ajoutons le provider scaleway etant un fournisseur francais

provider "scaleway" {
  zone   = "fr-par-1"
  region = "fr-par"
}
## nom du projet
variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "calculatrice-khalil-andre"
}

variable "environments" {
  description = "Liste des environnements"
  type        = list(string)
  default     = ["development", "production"]
}

variable "dns_domain" {
  description = "Domaine DNS de base"
  type        = string
  default     = "polytech-dijon.kiowy.net"
}
#premiere ressoure pour definir un registre de conteneur.

resource "scaleway_registry_namespace" "main" {
  name        = "${var.project_name}-registry"
  description = "registre de conteneur pour ${var.project_name}"
  is_public   = false
}

resource "scaleway_k8s_cluster" "main" {
  name    = "${var.project_name}-cluster"
  version = "1.29.1"
  cni     = "cilium"

  delete_additional_resources = true
}

resource "scaleway_k8s_pool" "main" {
  cluster_id = scaleway_k8s_cluster.main.id
  name       = "${var.project_name}-pool"
  node_type  = "DEV1-M"
  size       = 1

  autoscaling = true
  autohealing = true
  min_size    = 1
  max_size    = 3
}

resource "scaleway_rdb_instance" "database" {
  for_each = toset(var.environments)

  name           = "${var.project_name}-db-${each.key}"
  node_type      = "DB-DEV-S"
  engine         = "PostgreSQL-15"
  is_ha_cluster  = false
  disable_backup = each.key == "development" ? true : false
  user_name      = "admin"
  password       = "ChangeMeInProduction!"
}

resource "scaleway_lb" "main" {
  for_each = toset(var.environments)

  name = "${var.project_name}-lb-${each.key}"
  type = "LB-S"
}

resource "scaleway_domain_record" "prod" {
  dns_zone = var.dns_domain
  name     = "calculatrice-khalil-andre"
  type     = "A"
  data     = scaleway_lb.main["production"].ip_address
  ttl      = 3600
}

resource "scaleway_domain_record" "dev" {
  dns_zone = var.dns_domain
  name     = "calculatrice-dev-khalil-andre"
  type     = "A"
  data     = scaleway_lb.main["development"].ip_address
  ttl      = 3600
}

