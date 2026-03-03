# MySQL Production Deployment Guide

## Overview

This guide covers deploying the MySQL database for production use with managed cloud database services.

## Cloud Database Setup

### AWS RDS

**1. Create RDS MySQL Instance**

- MySQL version: 8.0 or higher
- Instance class:
  - Development: `db.t3.micro`
  - Production: `db.t3.small` or higher (based on traffic)
- Storage:
  - Minimum: 20 GB
  - Enable autoscaling
- VPC: Same VPC as your application server

**2. Configure Security**

- VPC security group allowing access from app server
- Password authentication enabled
- IAM role for backup/restore (optional)

**3. Connection String**

```bash
DATABASE_URL="mysql://username:password@instance.xxx.region.rds.amazonaws.com:3306/shopify_app_prod"
```

**Example:**

```bash
# AWS RDS (us-east-1)
DATABASE_URL="mysql://appuser:securepass@mydb-instance.c1234.us-east-1.rds.amazonaws.com:3306/shopify_app_prod"
```

### Google Cloud SQL

**1. Create Cloud SQL Instance**

- Database type: MySQL
- Version: MySQL 8.0
- Machine type:
  - Development: `db-f1-micro`
  - Production: `db-n1-standard-1` or higher
- Region: Same region as your application
- Storage: 10 GB minimum, with auto-increase

**2. Configure Connections**

**Option A: Private IP (Recommended)**
- Enable Private IP
- Connect via VPC network

**Option B: Cloud SQL Proxy**
```bash
# Install Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
mv cloud_sql_proxy.linux.amd64 cloud_sql_proxy
chmod +x cloud_sql_proxy

# Start proxy
./cloud_sql_proxy -instances=project:region:instance=tcp:3306
```

**3. Connection String**

```bash
# With Private IP
DATABASE_URL="mysql://user:pass@private-ip:3306/shopify_app_prod"

# With Cloud SQL Proxy
DATABASE_URL="mysql://user:pass@localhost:3306/shopify_app_prod"
```

**Example:**

```bash
# Cloud SQL Proxy
DATABASE_URL="mysql://appuser:securepass@localhost:3306/shopify_app_prod"
```

### Azure Database for MySQL

**1. Create MySQL Server**

- MySQL version: 8.0
- Pricing tier:
  - Development: `Basic`
  - Production: `General Purpose`
- Compute + storage scaling as needed
- Region: Same region as application

**2. Configure Firewall**

- Add client IP or allow Azure services
- Enable SSL enforcement (recommended)

**3. Connection String**

```bash
DATABASE_URL="mysql://user@server:password@server.mysql.database.azure.com:3306/shopify_app_prod"
```

**Example:**

```bash
# Azure MySQL
DATABASE_URL="mysql://appuser@myserver:securepass@myserver.mysql.database.azure.com:3306/shopify_app_prod"
```

## Environment Configuration

### Setting DATABASE_URL

**Via Shopify CLI:**

```bash
npm run env var DATABASE_URL "mysql://user:pass@host:3306/db"
```

**Or set in production environment variables:**

```bash
export DATABASE_URL="mysql://user:pass@host:3306/db"
```

**For different environments:**

```bash
# Development
DATABASE_URL="mysql://docker:docker@localhost:3306/docker"

# Staging
DATABASE_URL="mysql://user:pass@staging-db.example.com:3306/shopify_app_staging"

# Production
DATABASE_URL="mysql://user:pass@prod-db.example.com:3306/shopify_app_prod"
```

### Initial Setup

```bash
# Generate Prisma Client
npm run setup

# Or explicitly
npx prisma generate
npx prisma migrate deploy
```

## Connection Pooling

For production environments with high traffic, consider connection pooling:

### Prisma Built-in Connection Pool

Configure in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  connection_limit = 10
  pool_timeout = 2
}
```

### External Connection Pooling (Optional)

For very high traffic (>1000 concurrent users), consider:

- **ProxySQL** - MySQL proxy with connection pooling
- **PlanetScale** - Serverless MySQL-compatible database with built-in scaling

## Monitoring

### Check Connection Pool Usage

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Threads_running';
```

### Check Database Size

```sql
SELECT
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'shopify_app_prod';
```

### Check Session Table Growth

```sql
SELECT
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN expires > NOW() THEN 1 END) as active_sessions
FROM Session;
```

### Performance Monitoring

**Query Performance:**

```sql
-- Slow queries
SHOW VARIABLES LIKE 'slow_query_log';

-- Top queries by execution time
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

**Connection Metrics:**

```sql
-- Current connections
SHOW PROCESSLIST;

-- Connection statistics
SHOW STATUS LIKE '%connect%';
```

## Backup Strategy

### Automated Backups

Enable automated daily backups in your cloud provider:

- **AWS RDS**: Enable automated backups (1-35 days retention)
- **Google Cloud SQL**: Enable automated backups (7-365 days retention)
- **Azure MySQL**: Enable geo-redundant backups

### Manual Backup

```bash
# Using mysqldump
mysqldump -h host -u user -p shopify_app_prod > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -h host -u user -p shopify_app_prod | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Restore from SQL file
mysql -h host -u user -p shopify_app_prod < backup_20260302.sql

# Restore from compressed backup
gunzip < backup_20260302.sql.gz | mysql -h host -u user -p shopify_app_prod
```

### Point-in-Time Recovery

For critical production databases, enable point-in-time recovery:

- **AWS RDS**: Supported with automated backups
- **Google Cloud SQL**: Supported with pitr enabled
- **Azure MySQL**: Supported through backup retention

## Security Best Practices

### 1. Use Strong Passwords

```bash
# Generate strong password
openssl rand -base64 32
```

### 2. Enable SSL/TLS

Most cloud providers enforce SSL by default. Ensure your connection string uses:

```bash
DATABASE_URL="mysql://user:pass@host:3306/db?sslmode=require"
```

### 3. Restrict Access

- Use VPC/private network (not public internet)
- Whitelist specific IP addresses only
- Use firewall rules to restrict access

### 4. Rotate Credentials Regularly

```bash
# Update password
ALTER USER 'appuser'@'%' IDENTIFIED BY 'new_strong_password';
FLUSH PRIVILEGES;

# Update DATABASE_URL
npm run env var DATABASE_URL "mysql://appuser:new_strong_password@host:3306/db"
```

## Troubleshooting

### Connection Issues

**"Can't reach database server"**

1. Verify DATABASE_URL is correct
2. Check security group/firewall rules
3. Test connection manually:
   ```bash
   mysql -h host -u user -p -e "SELECT 1"
   ```

**"Access denied for user"**

1. Verify credentials in DATABASE_URL
2. Check user permissions:
   ```sql
   SHOW GRANTS FOR 'appuser'@'%';
   ```

**"Too many connections"**

1. Check connection limit:
   ```sql
   SHOW VARIABLES LIKE 'max_connections';
   ```
2. Increase limit in cloud provider settings
3. Implement connection pooling

### Performance Issues

**Slow queries**

1. Enable slow query log
2. Identify slow queries
3. Add indexes if needed

**High CPU usage**

1. Check connection count
2. Optimize queries
3. Consider scaling up instance class

### Migration Issues

**Migration fails in production**

1. Verify database schema:
   ```bash
   npx prisma db pull
   ```
2. Check for schema drift:
   ```bash
   npx prisma migrate status
   ```
3. Baseline existing database if needed:
   ```bash
   npx prisma migrate resolve --applied "migration_name"
   ```

## Scaling Considerations

### Vertical Scaling

- Increase instance class (CPU, RAM)
- Increase storage capacity
- Done via cloud provider console or CLI

### Horizontal Scaling

For applications requiring horizontal scaling (multiple app instances):

- Use external connection pooler (ProxySQL, PlanetScale)
- Implement read replicas for read-heavy workloads
- Consider managed services with automatic scaling

### When to Scale Up

Consider scaling when:
- Consistently high CPU usage (>70%)
- Connection pool frequently exhausted
- Query performance degrades
- Storage approaching limit

## Cost Optimization

### Development Environments

- Use smallest instance class (`db.t3.micro`, `db-f1-micro`)
- Stop instances when not in use
- Use shorter backup retention (1-7 days)

### Production Environments

- Right-size instances based on actual usage
- Use reserved instances for predictable workloads (AWS)
- Enable automated backups with appropriate retention
- Monitor and optimize queries to reduce resource usage

## Checklist

### Pre-Deployment

- [ ] Database instance created
- [ ] Security group/firewall configured
- [ ] DATABASE_URL configured
- [ ] SSL/TLS enabled
- [ ] Automated backups enabled
- [ ] Connection pooling configured (if needed)
- [ ] Monitoring setup

### Post-Deployment

- [ ] Test database connection
- [ ] Run `npx prisma migrate deploy`
- [ ] Verify Session table exists
- [ ] Test application authentication flow
- [ ] Verify sessions are being stored
- [ ] Set up alerts for:
  - High CPU usage
  - Connection exhaustion
  - Storage limits
  - Backup failures

### Ongoing Maintenance

- [ ] Review connection metrics weekly
- [ ] Monitor database size monthly
- [ ] Test backup restore procedure quarterly
- [ ] Review and update security credentials periodically
- [ ] Optimize slow queries as they appear

## Resources

- [Prisma MySQL Guide](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [AWS RDS MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_MySQL.html)
- [Google Cloud SQL for MySQL](https://cloud.google.com/sql/docs/mysql)
- [Azure Database for MySQL](https://docs.microsoft.com/azure/mysql)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/performance-schema.html)
