# Example: Remote state backend for production
# Don't commit this with real values!

terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "todo-app/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "terraform-lock-table"
  }
}