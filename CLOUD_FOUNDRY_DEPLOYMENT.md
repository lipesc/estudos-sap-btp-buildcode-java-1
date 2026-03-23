# Cloud Foundry Deployment Guide

## Quick Deployment

This guide walks through deploying the Estudos SAP BTP BuildCode Java 1 application to SAP Cloud Foundry.

---

## Prerequisites

### Account & Entitlements
- SAP BTP account with Cloud Foundry environment
- Space with at least **4GB memory** available
- Entitlements:
  - Cloud Foundry Runtime (app deployment)
  - SAP Postgres DB or equivalent database service

### Tools
- **Cloud Foundry CLI** (download: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)
- **Node.js** v18+ and **Maven** 3.8.1+ (for local build)
- **Git** for version control

### Verify Installation
```bash
cf --version          # Should show: cf version X.X.X
mvn --version        # Should show: Apache Maven X.X.X
node --version       # Should show: vX.X.X
npm --version        # Should show: X.X.X
```

---

## Step 1: Login to Cloud Foundry

### Get Your Cloud Foundry Endpoint

**In SAP BTP Cockpit**:
1. Go to Subaccount
2. "Overview" tab
3. Find "Cloud Foundry Environment"
4. Copy the **API Endpoint** (e.g., `https://api.cf.eu10.hana.ondemand.com`)

### Login via CLI

```bash
# Login to Cloud Foundry
cf login -a <YOUR_API_ENDPOINT>

# Example:
cf login -a https://api.cf.eu10.hana.ondemand.com

# Prompts:
# Email: <your-btp-username>@company.com
# Password: <your-btp-password>
# Org: <select-your-org>
# Space: <select-dev-or-test-space>
```

### Verify Login

```bash
# Check current target
cf target

# Output should show:
# API endpoint: https://api.cf.eu10.hana.ondemand.com
# Org: my-org
# Space: development
```

---

## Step 2: Clone Repository

```bash
# Clone the project
git clone https://github.com/<YOUR-ORG>/estudos-sap-btp-buildcode-java-1
cd estudos-sap-btp-buildcode-java-1

# Verify structure
ls -la
# Should show: app/, db/, srv/, mta.yaml, pom.xml, README.md, etc.
```

---

## Step 3: Build MTA Archive

The Multi-Target Application (MTA) archive packages both backend and frontend.

### Option A: Build with CAP CLI (Recommended)

```bash
# Install CAP development kit (if not already)
npm install -g @sap/cds-dk

# Install dependencies
npm install

# Build MTA archive
npm run build

# Verify build
ls -la mta_archives/

# Should show: estudos-sap-btp-buildcode-java-1_1.0.0.mtar
```

### Option B: Build with MBT (Multi-Target Build Tool)

```bash
# Install MBT (if not already)
npm install -g mbt

# Build dependencies
npm install
cd srv && npm install && cd ..
cd app/com.estudos.buildcode.java1.ui && npm install && cd ../../..

# Build MTA
mbt build

# Verify
ls -la mta_archives/
```

### Option C: Manual Build

```bash
# Build Java backend
mvn clean install

# Build Node dependencies
npm install

# The artifact will be in srv/target/
```

---

## Step 4: Deploy to Cloud Foundry

### Deploy the MTA

```bash
# Navigate to mtar directory
cd mta_archives

# Deploy the application
cf deploy estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# Wait for deployment to complete (5-15 minutes)
# You'll see progress messages like:
# Deploying app...
# Creating service instance...
# Starting application...
```

### Expected Output

```
Processing MTA "estudos-sap-btp-buildcode-java-1_1.0.0.mtar"...
Creating application "estudos-sap-btp-buildcode-java-1-srv"...
Waiting for application to start...
[✓] Process finished successfully
```

### Monitor Deployment

**In another terminal** (while deployment is running):

```bash
# View logs in real-time
cf logs estudos-sap-btp-buildcode-java-1-srv --recent

# Check application status
cf apps

# Expected output:
# name                                           status    instances memory disk
# estudos-sap-btp-buildcode-java-1-srv          started   2/2       1G    2G
```

---

## Step 5: Get Application URL

```bash
# List deployed applications
cf apps

# Find your app in the list
# Look for: estudos-sap-btp-buildcode-java-1-srv

# The route/URL is shown in the results
# Format: https://<app-name>-<space>.<region>.cfapps.<domain>

# Full URL to access application:
# https://estudos-sap-btp-buildcode-java-1-<space>-<org>.cfapps.eu10.hana.ondemand.com
```

Or query directly:

```bash
cf app estudos-sap-btp-buildcode-java-1-srv | grep routes
```

---

## Step 6: Access the Application

**Open in browser**:
```
https://<your-deployed-app-url>/com.estudos.buildcode.java1.ui/webapp/index.html
```

**You'll see**:
1. SAP XSUAA login form
2. Enter your SAP BTP username & password
3. Application homepage with launchpad tiles

---

## Verification Checklist

### ✅ Application Deployed

```bash
# Verify app is running
cf app estudos-sap-btp-buildcode-java-1-srv | grep status

# Should show: "status: started"
```

### ✅ Database Connected

```bash
# Check service bindings
cf service-bindings estudos-sap-btp-buildcode-java-1-srv

# Should show: postgres (or your DB service name)
```

### ✅ OData Endpoints Responding

**In browser console** (F12 → Network tab):
1. Open Application
2. Navigate to "Purchases" page
3. Check Network tab for:
   - GET `/odata/v4/service/estudos_buildcode_java_1_cds/Customers` → Status 200
   - GET `/odata/v4/service/estudos_buildcode_java_1_cds/Products` → Status 200

### ✅ Data Persistence Works

1. Go to Purchases → Create Purchase
2. Fill form (value: 1000, customer: Maria, product: any)
3. Click Create
4. Navigate to Customers page
5. Find Maria → Total Purchase Value increased
6. **Refresh** page (F5)
7. Value should **still show** (data persisted)

---

## Troubleshooting

### Problem: Deployment Fails

**Error**: "Insufficient quota for services"

**Solution**:
```bash
# Check available quota
cf quotas

# Check space quota usage
cf space-quotas

# If necessary, delete unused apps
cf delete <old-app-name>

# Then retry deploy
cf deploy estudos-sap-btp-buildcode-java-1_1.0.0.mtar
```

### Problem: Application Crashes

**Symptoms**: Status shows "crashed" in `cf apps`

**Debug**:
```bash
# View detailed logs
cf logs estudos-sap-btp-buildcode-java-1-srv --recent

# Look for error messages, e.g.:
# "[ERROR] Out of memory" → Increase memory
# "[ERROR] Database connection failed" → Check service binding
```

**Fix**:
```bash
# Increase memory if out of memory
cf scale estudos-sap-btp-buildcode-java-1-srv -m 1G

# Restart application
cf restart estudos-sap-btp-buildcode-java-1-srv

# Check status
cf app estudos-sap-btp-buildcode-java-1-srv
```

### Problem: 401 Unauthorized Errors

**Symptoms**: Login works but UI shows "401 Unauthorized" errors

**Cause**: XSUAA token validation issue

**Solution**:
```bash
# Re-bind XSUAA service
cf unbind-service estudos-sap-btp-buildcode-java-1-srv xsuaa

cf bind-service estudos-sap-btp-buildcode-java-1-srv xsuaa

# Restart app
cf restart estudos-sap-btp-buildcode-java-1-srv
```

### Problem: Database Empty After Deployment

**Symptoms**: Tables created but no seed data

**Note**: CSV seeding works in local H2, may need manual data import in Cloud

**Solution**: Create sample data via OData

```bash
# Use curl to create sample customer
curl -X POST https://<app-url>/odata/v4/service/estudos_buildcode_java_1_cds/Customers \
  -H "Authorization: Bearer $(cf oauth-token | grep -oP '(?<=bearer\s)\S+')" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "totalPurchaseValue": "1000.00",
    "totalRewardPoints": "100.00"
  }'
```

### Problem: Slow Performance

**Check resources**:
```bash
# View memory/CPU usage
cf top studos-sap-btp-buildcode-java-1-srv

# If consistently high:
cf scale estudos-sap-btp-buildcode-java-1-srv -m 1G  # Increase memory
```

---

## Scaling & Management

### Scale Application

```bash
# Increase memory
cf scale estudos-sap-btp-buildcode-java-1-srv -m 1G

# Increase instances
cf scale estudos-sap-btp-buildcode-java-1-srv -i 2

# View current scale
cf app estudos-sap-btp-buildcode-java-1-srv
```

### View Logs

```bash
# Recent logs only
cf logs estudos-sap-btp-buildcode-java-1-srv --recent

# Stream logs in real-time
cf logs estudos-sap-btp-buildcode-java-1-srv

# Filter for errors only
cf logs estudos-sap-btp-buildcode-java-1-srv --recent | grep ERROR
```

### Restart Application

```bash
# Graceful restart (stops and starts)
cf restart estudos-sap-btp-buildcode-java-1-srv

# Hard restart (kill and restart)
cf restart estudos-sap-btp-buildcode-java-1-srv --force

# Restage (recompile buildpack)
cf restage estudos-sap-btp-buildcode-java-1-srv
```

### Delete Application

```bash
# Remove app from Cloud Foundry
cf delete estudos-sap-btp-buildcode-java-1-srv

# Also remove service bindings
cf delete-service postgres-service  # if dedicated service
```

---

## Continuous Deployment

### Update Application

When you make code changes locally:

```bash
# 1. Commit changes
git add .
git commit -m "feat: your changes"
git push origin main

# 2. Pull latest (if deployed from different machine)
git pull origin main

# 3. Rebuild MTA
npm run build

# 4. Redeploy
cf deploy mta_archives/estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# 5. Verify
cf apps
```

### Blue-Green Deployment (Advanced)

For zero-downtime updates:

```bash
# Step 1: Deploy new version with different name
cf push estudos-sap-btp-buildcode-java-1-blue \
  -p mta_archives/estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# Step 2: Map new route
cf map-route estudos-sap-btp-buildcode-java-1-blue \
  <your-domain> \
  -n estudos-sap-btp-buildcode-java-1

# Step 3: Test new version

# Step 4: Remove old route (traffic switches)
cf unmap-route estudos-sap-btp-buildcode-java-1-srv \
  <your-domain> \
  -n estudos-sap-btp-buildcode-java-1

# Step 5: Delete old version
cf delete estudos-sap-btp-buildcode-java-1-srv
```

---

## Performance Tuning

### Java Heap Size

Edit **manifest.yml** or set environment variable:

```bash
cf set-env estudos-sap-btp-buildcode-java-1-srv \
  JAVA_OPTS "-Xmx768m -Xms512m"

cf restart estudos-sap-btp-buildcode-java-1-srv
```

### Database Connection Pool

In **srv/src/main/resources/application.yaml**:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
```

---

## Security Best Practices

1. **Secure Credentials**:
   ```bash
   # Never commit passwords or secrets
   # Use Cloud Foundry managed services for credentials
   cf services
   cf service-bindings estudos-sap-btp-buildcode-java-1-srv
   ```

2. **Update Dependencies**:
   ```bash
   # Check for security vulnerabilities
   npm audit
   npm audit fix
   mvn dependency:check
   ```

3. **HTTPS Only**:
   - Cloud Foundry enforces HTTPS by default
   - No manual config needed

4. **Access Control**:
   - XSUAA handles authentication
   - Define roles in `xs-security.json` for role-based access
   - Assign roles via SAP BTP Cockpit

---

## Monitoring & Alerts

### Health Checks

```bash
# Application health endpoint (if available)
curl https://<app-url>/health

# Logs for health info
cf logs estudos-sap-btp-buildcode-java-1-srv --recent | grep health
```

### Metrics

**In SAP BTP Cockpit**:
1. Go to Application Monitoring
2. View:
   - CPU usage
   - Memory usage
   - Network I/O
   - Request rate

### Set Up Alerts

**In SAP BTP Cockpit**:
1. Navigation → Incident Management
2. Create alert rules for:
   - Application crash
   - High memory usage (>800 MB)
   - High CPU (>80%)
   - Database connection failures

---

## Rollback

If deployment causes issues:

```bash
# Option 1: Redeploy previous version
git checkout <previous-commit>
npm run build
cf deploy mta_archives/estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# Option 2: Quick restart (if issue is transient)
cf restart estudos-sap-btp-buildcode-java-1-srv

# Option 3: Scale back to 0 instances (if broken)
cf scale estudos-sap-btp-buildcode-java-1-srv -i 0
```

---

## Summary

| Task | Command | Time |
|------|---------|------|
| Connect to CF | `cf login -a <api>` | 1 min |
| Clone repo | `git clone ...` | 1 min |
| Build MTA | `npm run build` | 3 min |
| Deploy | `cf deploy ...mtar` | 10 min |
| Verify | `cf apps` | 1 min |
| **Total** | | **16 min** |

---

## Support

- **Cloud Foundry Docs**: https://docs.cloudfoundry.org/
- **SAP Cloud Platform**: https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/
- **CAP Documentation**: https://cap.cloud.sap/
- **Project README**: See `README.md` in repository

---

**Version**: 1.0  
**Last Updated**: March 2026
