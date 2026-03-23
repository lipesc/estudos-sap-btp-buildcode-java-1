# SAP Build Online Integration Guide

## Overview

This guide provides step-by-step instructions for importing and using the **Estudos SAP BTP - BuildCode Java 1** application in **SAP Build Online** (formerly known as SAP buildCode).

SAP Build Online is a low-code/no-code platform for rapid application development on SAP BTP. This project can be imported as a full-stack application with pre-built backend logic and UI.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Accessing SAP Build Online](#accessing-sap-build-online)
3. [Importing the Project](#importing-the-project)
4. [Project Structure in SAP Build](#project-structure-in-sap-build)
5. [Configuring the Application](#configuring-the-application)
6. [Testing in SAP Build](#testing-in-sap-build)
7. [Deploying to Cloud Foundry](#deploying-to-cloud-foundry)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Prerequisites

### SAP BTP Account
- Active SAP BTP Main Account or Trial account
- Access to Cloud Foundry environment
- At least **2GB memory allowance** (for app deployment)

### Entitlements
Ensure your SAP BTP account has these entitlements:
- **App Build (SAP Build Online)**: At least 1 subscription
- **Cloud Foundry Runtime**: Standard plan (for deployment)
- **Postgres DB**: Standard plan (optional, uses free tier if available)

**To check entitlements**:
1. Log in to SAP BTP Cockpit
2. Navigate to **Global Account** → **Entitlements**
3. Search for "buildCode" and "Cloud Foundry"
4. Assign if not already assigned

### Tools & Access
- Browser with JavaScript enabled (Chrome, Firefox, Edge)
- GitHub account with access to this repository (for cloning)
- SAP Cloud Foundry CLI installed locally (for manual deployment)
- Text editor (optional, for modifying configs)

---

## Accessing SAP Build Online

### Step 1: Log In to SAP BTP Cockpit
```
URL: https://cockpit.hanatrial.ondemand.com  (Trial)
     OR
     https://cockpit.btp.cloud.sap          (Production)

Credentials: Your SAP BTP user + password
```

### Step 2: Navigate to Your Subaccount
1. Select your subaccount from the list
2. Click on **Instances and Subscriptions** (left sidebar)

### Step 3: Find SAP Build Online
1. Under "Subscriptions" tab
2. Search for **"buildCode"** or **"SAP Build Online"**
3. Click the application tile to open it

**Alternative**: Direct URL access
```
https://<region>.build.cloud.sap/

# Example:
https://eu10.build.cloud.sap/
```

### Step 4: Create a New Project or Import

You should see the SAP Build Online dashboard with options:
- **Create New Project**
- **Import Project from Repository** ← Use this for GitHub import

---

## Importing the Project

### Method 1: Import from GitHub Repository

1. **In SAP Build Online Dashboard**:
   - Click **"Import Project"**
   - Select **"From Git Repository"**

2. **Enter Repository Details**:
   ```
   Repository URL: https://github.com/<YOUR-ORG>/estudos-sap-btp-buildcode-java-1
   Branch: main
   (Leave credentials empty if public repo)
   ```

3. **Wait for Import**:
   - SAP Build downloads repository
   - Analyzes project structure
   - Creates local workspace (may take 1-2 minutes)

4. **Import Complete**:
   - Project opens in SAP Build editor
   - You see folder structure on left panel
   - Central editor shows files

### Method 2: Manual Setup

If GitHub import fails:

1. **Download as ZIP**:
   - Visit GitHub repository
   - Click **"Code"** → **"Download ZIP"**

2. **Extract locally**:
   ```bash
   unzip estudos-sap-btp-buildcode-java-1-main.zip
   cd estudos-sap-btp-buildcode-java-1-main
   ```

3. **Create in SAP Build**:
   - In SAP Build, click **"Create New Project"**
   - Select **"Java with CAP"** template
   - Upload files from extracted folder

---

## Project Structure in SAP Build

After import, you'll see this structure in SAP Build editor:

```
📁 Project Root
├── 📁 db
│   ├── 📄 schema.cds           (Data model definitions)
│   ├── 📁 data                 (Seed data CSV files)
│   └── 📄 package.json
├── 📁 app
│   └── 📁 com.estudos.buildcode.java1.ui
│       └── 📁 webapp           (UI5 application)
│           ├── 📄 index.html
│           ├── 📁 controller
│           ├── 📁 view
│           └── 📁 img
├── 📁 srv
│   ├── 📄 service.cds          (OData service definition)
│   ├── 📄 pom.xml              (Java/Maven config)
│   └── 📁 src/main/java        (Backend code)
├── 📄 mta.yaml                 (Multi-target app config)
├── 📄 README.md                (Project documentation)
└── 📄 TECHNICAL_DETAILS.md     (Implementation details)
```

### Key Files to Review in SAP Build

1. **db/schema.cds**
   - Defines Customers, Products, Purchases, Redemptions entities
   - Check field types match your requirements
   - Entity relationships defined here

2. **srv/service.cds**
   - Defines what entities are exposed as OData
   - Service path is `/service/estudos_buildcode_java_1_cds`

3. **app/.../webapp/view/Main.view.xml**
   - SAPUI5 view structure
   - Pages: Home, Purchases, Create Purchase, Customers
   - You can modify layout visually in SAP Build

4. **app/.../webapp/controller/Main.controller.js**
   - Business logic for UI interactions
   - OData calls and data binding logic
   - Reward calculation on purchase

---

## Configuring the Application

### Step 1: Review Data Model

**In SAP Build, click "Data Model" tab** (if available):

1. **Customers**:
   - Fields: name, email, totalPurchaseValue, totalRewardPoints
   - UUID as primary key
   - No relationships need configuration

2. **Products**:
   - Fields: name, price
   - UUID as primary key

3. **Purchases**:
   - Fields: purchaseValue, rewardPoints, customerID, productID
   - Foreign keys link to Customers and Products
   - ⚠️ **Important**: rewardPoints auto-calculated (10% of purchaseValue)

4. **Redemptions**:
   - Fields: customerID, rewardPointsRedeemed, redeemedAt
   - Foreign key to Customers

### Step 2: Configure Database Connection

**For Local Development** (in SAP Build):
- Default: In-memory H2 database (no configuration needed)
- Seed data loads automatically from `db/data/` CSV files

**For Cloud Foundry Deployment** (configure later):
- PostgreSQL service auto-created via `mta.yaml`
- Service binding handled by Cloud Foundry

### Step 3: Review Security Configuration

**Optional**: In SAP Build editor:

1. Open **srv/src/main/java/.../LocalSecurityConfiguration.java**
2. Verify scoped security matcher includes:
   - `/com.estudos.buildcode.java1.ui/**` (UI route)
   - `/odata/**` (OData service)
3. Leave as-is for local development
4. Cloud Foundry will override with XSUAA automatically

### Step 4: Customize (Optional)

**Modify UI in SAP Build**:
1. Open **app/.../webapp/view/Main.view.xml**
2. SAP Build may provide visual editor
3. Drag controls, change text, reorder pages
4. Changes save automatically

**Modify Data Model**:
1. Add new fields to entities in `db/schema.cds`
2. SAP Build may auto-generate OData endpoints
3. Update UI to display new fields

---

## Testing in SAP Build

### Test Locally in SAP Build (Preview Mode)

**Step 1: Start Local Preview**
1. In SAP Build menu, find **"Run"** or **"Preview"** button
2. Select **"Java Backend"** or **"Spring Boot"**
3. Click "Start"
   - Local Java runtime starts (port 8080 or similar)
   - H2 database initializes
   - Seed data loads

**Step 2: Open Preview Interface**
1. SAP Build opens preview pane or new tab
2. Application loads at local URL:
   ```
   http://localhost:8080/com.estudos.buildcode.java1.ui/webapp/index.html
   ```

**Step 3: Test Features**
- ✅ Homepage launchpad loads with tiles
- ✅ Click "Purchases" tile → purchases list appears
- ✅ Click "Create" button → create form opens
- ✅ Fill form (Purchase Value, Customer, Product)
- ✅ Click "Create" → data saves to backend
- ✅ Navigate to "Customers" → see updated totals
- ✅ Refresh browser → data persists

### Common Test Scenarios

1. **Test Reward Calculation**:
   - Enter Purchase Value: 1000
   - Expected Reward Points: 100 (10% auto-calculated)

2. **Test Customer Total Update**:
   - Current customer total: 1200.00 (from seed data)
   - Create purchase: 500
   - Expected new total: 1700.00

3. **Test Filter**:
   - Go to Purchases list
   - Enter customer number in filter
   - Click "Go"
   - Only that customer's purchases show

4. **Test Persistence**:
   - Create purchase
   - Refresh browser (F5)
   - Data should still exist (saved to backend)

### Debug Issues in SAP Build

**Console Errors**:
- Press F12 → Browser DevTools
- Check Network tab for OData requests
- Check Console tab for JavaScript errors

**Backend Issues**:
- Check SAP Build console output
- Look for "ERROR" messages in startup logs
- Verify Java runtime started successfully

---

## Deploying to Cloud Foundry

### Step 1: Prepare for Deployment

**In SAP Build, open build configuration**:
1. Find **"Build"** or **"Deploy"** menu
2. Select **"Multi-Target Application (MTA)"**
3. Review **mta.yaml** settings:
   ```yaml
   ID: estudos-sap-btp-buildcode-java-1
   version: 1.0.0
   
   # Should contain:
   # - srv module (Java backend)
   # - app module (UI5 frontend)
   # - db resource (PostgreSQL)
   ```

### Step 2: Build MTA Archive

**Option A: Build in SAP Build** (Recommended)
1. Click "Build" → "Build MTA Archive"
2. Wait for build to complete (2-5 minutes)
3. Download `.mtar` file
   ```
   estudos-sap-btp-buildcode-java-1_1.0.0.mtar
   ```

**Option B: Build Locally**
```bash
# Prerequisites: Node.js, Maven installed

# From project root:
npm install
mvn -f srv/pom.xml clean package

npm install -g @sap/cds-dk  # If not installed
npm run build

# Creates: mta_archives/estudos-sap-btp-buildcode-java-1_1.0.0.mtar
```

### Step 3: Deploy to Cloud Foundry

**Prerequisites before deployment**:
- Cloud Foundry space created in SAP BTP
- Cloud Foundry CLI (`cf` command) installed
- Logged in to Cloud Foundry

**Option A: Deploy via SAP Build** (Easiest if available)
1. In SAP Build, click "Deploy"
2. Select target Cloud Foundry org/space
3. Click "Deploy"
4. Wait for deployment (10-15 minutes)
5. SAP Build shows deployed URL

**Option B: Deploy via Cloud Foundry CLI**

```bash
# Step 1: Download .mtar file from SAP Build
# Assume file: estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# Step 2: Open terminal and navigate to mtar location
cd <path-to-mtar-file>

# Step 3: Log in to Cloud Foundry
cf login -a https://api.cf.<region>.hana.ondemand.com

# Example for EU:
cf login -a https://api.cf.eu10.hana.ondemand.com

# Step 4: Select org and space
cf target -o <your-org> -s <dev>

# Step 5: Deploy
cf deploy estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# Step 6: Monitor deployment
# Output shows progress, final message: "Deploy successful"
```

**Expected Output**:
```
Started application "estudos-sap-btp-buildcode-java-1-srv"
Waiting for "estudos-sap-btp-buildcode-java-1-srv" to start...
[✓] Application "estudos-sap-btp-buildcode-java-1-srv" started
Deployed MTA with ID "estudos-sap-btp-buildcode-java-1_1.0.0"
```

### Step 4: Get Application URL

**After successful deployment**:
```bash
# List deployed apps
cf apps

# Output shows:
# estudos-sap-btp-buildcode-java-1-srv   started  2/2   512M   1G

# Application URL:
# https://estudos-sap-btp-buildcode-java-1-<space>-<org>.cfapps.<region>.hana.ondemand.com
```

**Full URL format**:
```
https://<your-app-name>.<your-space>.<your-org>.cfapps.eu10.hana.ondemand.com
```

---

## Post-Deployment Verification

### Step 1: Access the Application

**Open in browser**:
```
https://<deployed-app-url>/com.estudos.buildcode.java1.ui/webapp/index.html
```

**Expected login screen**:
- SAP XSUAA login form (username/password)
- Enter your SAP BTP credentials

### Step 2: Verify All Pages Load

| Page | URL Pattern | Test |
|------|------------|------|
| Home | `/index.html` | Launchpad tiles visible |
| Purchases | Home → Click Purchases tile | Purchase table shows sample data |
| Create Purchase | Purchases → Click Create | Form with dropdowns visible |
| Customers | Home → Purchases → Select Customers from dropdown | Customer list with totals |

### Step 3: Test Data Persistence

1. **Create a purchase**:
   - Go to Purchases → Create
   - Fill form (value: 1500, customer: any, product: any)
   - Click Create
   - Should see success (toast notification or page reload)

2. **Verify in Customers**:
   - Navigate to Customers from dropdown menu
   - Find the customer you selected
   - Total Purchase Value should increase
   - Total Reward Points should increase by 150 (10% of 1500)

3. **Refresh and verify persistence**:
   - Press F5 to refresh browser
   - Values should still show (data persisted to Cloud Foundry database)

### Step 4: Monitor Application Health

**Check logs in Cloud Foundry**:
```bash
# View application logs
cf logs estudos-sap-btp-buildcode-java-1-srv --recent

# Expected messages:
# Started application "estudos-sap-btp-buildcode-java-1-srv"
# INFO  [main] com.sap.cds.CdsApplication : Started CdsApplication
# Spring Boot app started successfully
```

**Verify no errors**:
- No "ERROR" messages in logs
- No "SQLException" for database
- No "401 Unauthorized" messages

---

## Monitoring & Troubleshooting

### Application Monitoring

**In SAP BTP Cockpit**:
1. Navigate to Subaccount → **"Applications"**
2. Find **"estudos-sap-btp-buildcode-java-1-srv"**
3. View:
   - **Status**: Should be "Started" (green)
   - **Memory**: Usage should stabilize ~200-300 MB
   - **Instances**: 1 instance running
   - **Logs**: Click to view real-time logs

### Common Issues & Solutions

#### Issue 1: Application Won't Start (Status: "Crashed")

**Symptoms**:
- App shows red "crashed" status in Cockpit
- Can't access application URL

**Troubleshooting**:
```bash
# View detailed logs
cf logs estudos-sap-btp-buildcode-java-1-srv --recent

# Look for:
# - "Out of memory" → Increase memory allocation
# - "PostgreSQL connection error" → Check database service binding
# - "Java version" → Verify correct Java version in pom.xml
```

**Solutions**:
- Increase memory: `cf scale <app-name> -m 1G`
- Restart app: `cf restart <app-name>`
- Check database exists: `cf services`

#### Issue 2: 401 Unauthorized on UI

**Symptoms**:
- Login works
- UI shows "401 Unauthorized" in browser console
- OData calls fail with 401

**Cause**: XSUAA token validation failing

**Solution**:
```bash
# Verify XSUAA service bound
cf env estudos-sap-btp-buildcode-java-1-srv

# Should show:
# VCAP_SERVICES: {...xsuaa...}
```

#### Issue 3: Data Not Persisting

**Symptoms**:
- Can create purchase
- Refresh → Data gone
- Customer totals not updating

**Troubleshooting**:
```bash
# Check database service binding
cf service-bindings estudos-sap-btp-buildcode-java-1-srv

# Should show PostgreSQL binding
# If missing: Re-deploy to recreate binding
```

#### Issue 4: "Out of Quota" Error During Deployment

**Symptom**: Deployment fails with quota error

**Solution**:
1. Check entitlements: SAP BTP Cockpit → Entitlements
2. Increase Cloud Foundry quota or free up space
3. Delete unused applications: `cf delete <old-app>`
4. Retry deployment

#### Issue 5: Seed Data Not Loaded

**Symptom**: Database tables empty after deployment

**Note**: CSV seeding works in local H2, may not auto-load in Cloud Foundry

**Solution**:
- Seed data manually via OData:
  ```bash
  curl -X POST https://<app-url>/odata/v4/service/.../Customers \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"John", "email":"john@example.com", ...}'
  ```

### Performance Monitoring

**Check application performance**:

```bash
# View memory usage
cf app estudos-sap-btp-buildcode-java-1-srv

# View request logs (sample)
cf logs estudos-sap-btp-buildcode-java-1-srv --recent | grep "GET\|POST\|PATCH"

# Monitor for high latency
# Expected response times:
# - GET /Customers: <100ms
# - POST /Purchases: <200ms
# - PATCH /Customers: <200ms
```

### Database Management

**Connect to Cloud Foundry PostgreSQL** (for advanced debugging):

```bash
# Create SSH tunnel
cf ssh estudos-sap-btp-buildcode-java-1-srv -L 5432:localhost:5432

# Connect with psql (from another terminal)
psql -h localhost -U <username> -d <db_name>

# View tables
\dt

# Query data
SELECT * FROM Customers;
```

---

## Best Practices for Deployment

1. **Version Control**:
   - Always commit changes before deployment
   - Tag releases: `git tag v1.0.0`
   - Maintain clean main branch

2. **Testing Before Deployment**:
   - Test locally in SAP Build first
   - Verify all OData calls work
   - Test data persistence
   - Check browser console for errors

3. **Deployment Checklist**:
   - ✅ All code changes committed
   - ✅ Build successful (no errors)
   - ✅ mta.yaml reviewed and correct
   - ✅ Target Cloud Foundry space verified
   - ✅ Sufficient quota available
   - ✅ Database service configured

4. **Zero-Downtime Updates**:
   ```bash
   # Deploy with no service interruption
   cf push estudos-sap-btp-buildcode-java-1-srv \
     --strategy rolling \
     --wait-for-state-timeout 15m
   ```

5. **Rollback Strategy**:
   ```bash
   # Keep previous version deployed
   # If new version fails, route traffic back to old
   cf unmap-route <new-app> <domain>
   cf map-route <old-app> <domain>
   ```

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Access SAP Build Online | 1 min |
| 2 | Import GitHub repository | 2 min |
| 3 | Review project structure | 5 min |
| 4 | Test locally in SAP Build | 10 min |
| 5 | Build MTA archive | 3 min |
| 6 | Deploy to Cloud Foundry | 10 min |
| 7 | Verify application | 5 min |
| **Total** | | **36 min** |

---

## Support & Resources

- **SAP Build Online Docs**: https://help.sap.com/docs/SAP_BUILD
- **Cloud Foundry CLI**: https://docs.cloudfoundry.org/cf-cli/
- **CAP Documentation**: https://cap.cloud.sap/
- **SAPUI5 Learning**: https://sapui5.hana.ondemand.com/

---

**Document Version**: 1.0  
**Last Updated**: March 2026  
**Target Audience**: SAP BTP Developers, BuildCode Users
