# Technical Implementation Details

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Technology Decisions](#technology-decisions)
- [Component Breakdown](#component-breakdown)
- [Data Flow & Persistence](#data-flow--persistence)
- [Security Implementation](#security-implementation)
- [OData Service Layer](#odata-service-layer)
- [Frontend Architecture](#frontend-architecture)
- [Backend Java Implementation](#backend-java-implementation)
- [Deployment Architecture](#deployment-architecture)
- [Known Limitations & Workarounds](#known-limitations--workarounds)

---

## Architecture Overview

This application follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         SAPUI5 Frontend (Tier 1)        │
│  - Multi-page responsive MVC application│
│  - Real-time JSONModel data binding    │
│  - OData V4 client consumption         │
└────────────────┬────────────────────────┘
                 │
                 │ HTTP/HTTPS
                 │ OData V4 Protocol
                 │
┌────────────────▼────────────────────────┐
│   CAP Java Service Layer (Tier 2)       │
│  - Spring Boot 3.5.8 runtime           │
│  - OData V4 endpoints via CAP          │
│  - Spring Security for auth             │
│  - Business logic handlers              │
└────────────────┬────────────────────────┘
                 │
                 │ JDBC/JPA
                 │ Database Operations
                 │
┌────────────────▼────────────────────────┐
│      H2 / PostgreSQL Database (Tier 3)  │
│  - CSV seed data loading (local)       │
│  - Cloud Foundry managed services (CF) │
│  - Persistent entity storage            │
└─────────────────────────────────────────┘
```

### Design Principles
1. **CAP-First Development**: Entities defined in CDS, automatically exposed as OData
2. **Non-Draft Entities**: Simplified transaction handling without draft states
3. **Mock Authentication (Local)**: Development-friendly, XSUAA-compatible (Cloud)
4. **Scoped Security**: Spring Security matcher prevents conflicts with CAP defaults
5. **Data-Driven UI**: UI5 JSONModel bindings drive all state changes

---

## Technology Decisions

### 1. CAP Framework (Java Runtime)
**Decision**: Use CAP Java instead of Node.js
**Rationale**:
- Type safety and performance for business logic
- Enterprise integration patterns supported
- Spring Boot ecosystem compatibility
- Better suited for complex calculations (reward logic)
- Aligns with customer's Java backend expertise

**Trade-offs**:
- Larger deployment footprint vs. Node.js
- Longer startup time
- More verbose configuration

### 2. SAPUI5 Frontend
**Decision**: Use SAPUI5 1.146 via CDN
**Rationale**:
- SAP's standard enterprise UI framework
- Built-in themes and accessibility
- Fiori design system support
- OData V4 native bindings
- Large component library

**Trade-offs**:
- Framework size (but loaded from CDN, minor impact)
- Learning curve for new developers
- Requires SAP licensing in some scenarios

### 3. OData V4 Service Protocol
**Decision**: OData V4 (not REST)
**Rationale**:
- CAP's native protocol
- SAPUI5 optimized for OData
- Query capabilities (filtering, sorting, expansion)
- Batch request support
- Standard in SAP ecosystem

### 4. H2 Database (Local) + PostgreSQL (Cloud)
**Decision**: In-memory H2 for development, managed PostgreSQL for Cloud Foundry
**Rationale**:
- H2: Zero configuration, batteries included for local dev
- PostgreSQL: Performance, reliability, Cloud Foundry support
- Easy migration: SQL standard compliance

### 5. Spring Security for Local Development
**Decision**: Custom Spring Security config instead of CAP defaults
**Rationale**:
- CAP MockUsersSecurityConfig creates catch-all matcher
- Custom matcher scoped to `/ui/**` and `/service/**` routes
- Allows development with automatic mock user in local environment
- Production uses XSUAA (handled by Cloud Foundry)

---

## Component Breakdown

### Frontend: SAPUI5 Multi-Page Application

**File**: `app/com.estudos.buildcode.java1.ui/webapp/controller/Main.controller.js`

#### Key Methods

```javascript
onInit()
  ↓ (calls)
_loadCustomers() - Async fetch from /Customers
_loadProducts() - Async fetch from /Products
_loadPurchases() - Async fetch with customer filter
_readEntityWithFallback() - Retry logic for OData calls
  
onOpenCustomers()
  ↓
Navigate to customersPage, trigger _loadCustomers()

onOpenPurchases()
  ↓
Navigate to purchasesPage, show filter UI

onCreatePurchase()
  ↓
Navigate to createPurchasePage, show form with auto-calculated rewards

onSavePurchase()
  ↓
1. POST /Purchases (create purchase record)
  ↓
2. PATCH /Customers(<ID>) (update totals)
  ↓
3. _loadPurchases() + _loadCustomers() (refresh models)
  ↓
4. Navigate to customersPage (show updated data)

onShellNavChange()
  ↓
Navigate between pages (home, purchases, customers, redemptions)

_loadPurchases()
  ↓
Apply filter if customer number entered
```

#### Data Models (JSONModel)

```javascript
models = {
  customers: {
    items: [
      {
        ID: "<uuid>",
        name: "Maria",
        email: "maria@example.com",
        totalPurchaseValue: 1200.00,
        totalRewardPoints: 120.00
      },
      ...
    ]
  },
  products: {
    items: [
      {
        ID: "<uuid>",
        name: "Product A",
        price: 100.00
      },
      ...
    ]
  },
  purchases: {
    items: [
      {
        ID: "<uuid>",
        purchaseValue: 1200.00,
        rewardPoints: 120.00,
        customerName: "Maria",
        productName: "Product A"
      },
      ...
    ]
  }
}
```

#### OData Endpoints Called

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/Customers` | Load all customers for display |
| GET | `/Products` | Load products for dropdown selection |
| GET | `/Purchases?$filter=...` | Load purchases with optional customer filter |
| POST | `/Purchases` | Create new purchase record |
| PATCH | `/Customers(<uuid>)` | Update customer totals after purchase |

**URL Format**: All OData calls prefixed with `http://localhost:8080/odata/v4/service/estudos_buildcode_java_1_cds/`

### Frontend: UI5 Views

**File**: `app/com.estudos.buildcode.java1.ui/webapp/view/Main.view.xml`

#### View Structure

```xml
<App id="appNav">
  ├── homePage
  │   ├── SAP Logo + Title
  │   ├── Shell Navigation Dropdown
  │   └── Launchpad (GenericTiles)
  │       ├── Customers tile → onOpenCustomers()
  │       ├── Purchases tile → onOpenPurchases()
  │       └── Redemptions tile → onOpenRedemptions()
  │
  ├── purchasesPage
  │   ├── Header with logo + dropdown
  │   ├── Filter section
  │   │   └── Customer Number Input
  │   │   └── Go Button → onGoPurchases()
  │   └── Purchases Table
  │       └── Create Button → onCreatePurchase()
  │
  ├── createPurchasePage
  │   ├── Header with logo + dropdown
  │   └── ObjectPageLayout (form)
  │       ├── Purchase Value (Number Input)
  │       ├── Customer (Dropdown, JSONModel binding)
  │       ├── Product (Dropdown, JSONModel binding)
  │       ├── Reward Points (Calculated, read-only)
  │       └── Create Button → onSavePurchase()
  │
  └── customersPage
      ├── Header with logo + dropdown
      └── Customers Table
          ├── Customer Name
          ├── Email
          ├── Total Purchase Value
          └── Total Reward Points
```

#### Control Binding Details

- **GenericTiles**: No data binding (hardcoded numbers)
- **Tables**: `items="{<model>:/items}"` — binds to model.items array
- **Inputs**: `value="{<model>>fieldName}"` — two-way binding
- **Dropdowns**: `items="{<model>:/items}"` + template binding

---

## Data Flow & Persistence

### Complete Purchase Creation Flow

```
User fills Purchase Form
         │
         ▼
┌─────────────────────────────────┐
│ onSavePurchase() triggered      │
│ (Click "Create" button)         │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Extract form values:            │
│  - purchaseValue = 1200         │
│  - customerID = <uuid>          │
│  - productID = <uuid>           │
│  - rewardPoints = 1200 × 0.1    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ POST /Purchases                 │
│ Content-Type: application/json  │
│ Body: {                         │
│   purchaseValue: 1200,          │
│   rewardPoints: 120,            │
│   customerID: <uuid>,           │
│   productID: <uuid>             │
│ }                               │
└─────────────────────────────────┘
         │
         ▼ Success (HTTP 200/201)
         │
         ▼
┌─────────────────────────────────┐
│ Backend stores purchase in DB   │
│ (H2 in-memory or PostgreSQL)    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ PATCH /Customers(<uuid>)        │
│ Content-Type: application/json  │
│ Body: {                         │
│   totalPurchaseValue: 2200,     │
│   totalRewardPoints: 220        │
│ }                               │
└─────────────────────────────────┘
         │
         ▼ Success (HTTP 200)
         │
         ▼
┌─────────────────────────────────┐
│ Backend updates customer totals │
│ in DB (persistent)              │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ UI: _loadCustomers() [async]    │
│ UI: _loadPurchases() [async]    │
│ Refresh both models with latest │
│ data from backend               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Navigate to customersPage       │
│ Display updated totals          │
└─────────────────────────────────┘
```

### Why PATCH Customer Totals?

**Problem**: When a purchase is created, reward points calculated on frontend but not persisted to customer totals.
**Solution**: After successful purchase POST, immediately PATCH customer record with incremented totals.
**Key Insight**: This keeps frontend and backend in sync, ensures persistence across refresh cycles.

---

## Security Implementation

### Local Development (Spring Security + CAP Mock)

**File**: `srv/src/main/java/customer/estudos_buildcode_java_1/LocalSecurityConfiguration.java`

```java
@Configuration
@EnableWebSecurity
@Profile("default")
@Order(0)  // Execute BEFORE CAP's MockUsersSecurityConfig
public class LocalSecurityConfiguration {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/", "/index.html", "/favicon.ico", 
                            "/com.estudos.buildcode.java1.ui/**",
                            "/service/**", "/odata/**", "/$fiori-preview/**")
            .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
            .formLogin().disable()
            .logout().disable()
            .httpBasic().disable();
        return http.build();
    }
}
```

**Key Points**:
- `@Order(0)` ensures this chain runs BEFORE CAP's default (higher order)
- `securityMatcher()` scopes this config to UI + service routes only
- `permitAll()` allows unauthenticated access to UI in local environment
- All other routes fall through to CAP's MockUsersSecurityConfig

### Authentication Header Format (Local)

```
Authorization: Basic YXV0aGVudGljYXRlZDo=

Decoded:
  Username: authenticated:
  Password: (empty)
```

Used by OData calls in Main.controller.js:
```javascript
this._authHeaders = {
  "Authorization": "Basic YXV0aGVudGljYXRlZDo="
};
```

### Cloud Foundry (XSUAA Integration)

**At deployment time**:
1. Cloud Foundry injects `@EnableWebSecurity` 
2. Spring Security automatically binds to XSUAA service
3. OAuth2 token validation happens transparently
4. LocalSecurityConfiguration ignored (different profile)

**Token Flow**:
```
User Browser
     │
     ▼
SAP XSUAA (Identity provider)
     │
     ▼ (OAuth2 token)
     │
     ▼
Spring Security (validates token)
     │
     ▼
OData Endpoint (authorized request processed)
```

---

## OData Service Layer

**File**: `srv/service.cds`

### Service Definition

```cds
@path: '/service/estudos_buildcode_java_1_cds'
@requires: 'any'  // Permit all authenticated users
service EstudosBuildcodeJava1CdsService {
    
    entity Customers {
        key ID : UUID;
        name : String;
        email : String;
        totalPurchaseValue : Decimal(15,2);
        totalRewardPoints : Decimal(15,2);
    }
    
    entity Products {
        key ID : UUID;
        name : String;
        price : Decimal(15,2);
    }
    
    entity Purchases {
        key ID : UUID;
        purchaseValue : Decimal(15,2);
        rewardPoints : Decimal(15,2);  // Auto-calculated: purchaseValue × 0.1
        customer : Association to Customers;
        product : Association to Products;
        createdAt : Timestamp;
    }
    
    entity Redemptions {
        key ID : UUID;
        customer : Association to Customers;
        rewardPointsRedeemed : Decimal(15,2);
        redeemedAt : Timestamp;
    }
}
```

### Generated Endpoints

CAP automatically creates REST endpoints:

```
GET/POST   /Customers
GET        /Customers(<id>)
PATCH      /Customers(<id>)
DELETE     /Customers(<id>)

GET/POST   /Products
GET        /Products(<id>)
PATCH      /Products(<id>)
DELETE     /Products(<id>)

GET/POST   /Purchases
GET        /Purchases(<id>)
PATCH      /Purchases(<id>)
DELETE     /Purchases(<id>)

GET/POST   /Redemptions
GET        /Redemptions(<id>)
PATCH      /Redemptions(<id>)
DELETE     /Redemptions(<id>)
```

### OData Query Examples

```bash
# Get all customers
GET /Customers

# Get specific customer
GET /Customers(550e8400-e29b-41d4-a716-446655440000)

# Filter customers by name
GET /Customers?$filter=substringof('Maria', name)

# Expand related purchases
GET /Customers?$expand=purchases

# Pagination
GET /Purchases?$skip=10&$top=5

# Sorting
GET /Customers?$orderby=name desc

# Update customer (PATCH)
PATCH /Customers(550e8400-e29b-41d4-a716-446655440000)
Content-Type: application/json

{
  "totalPurchaseValue": 2200.00,
  "totalRewardPoints": 220.00
}
```

---

## Frontend Architecture

### View Initialization Sequence

```
Browser loads /index.html
      │
      ▼
<script> loads index.html with boostrapping
      │
      ▼
sap.ui.getCore().attachInit(function() {
      │
      ▼
Main.controller.onInit()
      │
      ├─▶ _loadCustomers() [async, fetch /Customers]
      ├─▶ _loadProducts() [async, fetch /Products]
      └─▶ _loadPurchases() [async, default empty]
      │
      ▼
sap.ui.core.ComponentContainer renders homePage
```

### Model Initialization

```javascript
// In onInit():
oCustModel = new sap.ui.model.json.JSONModel();
oProdModel = new sap.ui.model.json.JSONModel();
oPurchModel = new sap.ui.model.json.JSONModel();

this.getView().setModel(oCustModel, "customers");
this.getView().setModel(oProdModel, "products");
this.getView().setModel(oPurchModel, "purchases");

// Models initially empty
// Populated after async OData calls complete
```

### Fiori Layout Pattern

**Launchpad** (Homepage):
- GenericTile controls display as launch points
- Each tile press event navigates to detail page
- Simple navigation model (no back button logic needed)

**List Report** (Purchases Page):
- Filter bar for customer number
- Table with selection
- Create button for new record
- Follows Fiori List Report pattern

**Object Page** (Create Purchase Form):
- ObjectPageLayout provides form structure
- Sections for data entry
- Auto-calculated field (reward points)
- Footer toolbar with Create button

**Master Detail** (Customers Table):
- Full-width table view
- Read-only display (no inline editing)
- Aggregate totals shown

---

## Backend Java Implementation

### Project Structure

```
srv/
├── pom.xml                      # Maven config
├── src/main/java/
│   └── customer/
│       └── estudos_buildcode_java_1/
│           └── LocalSecurityConfiguration.java  [CUSTOM]
├── src/main/resources/
│   ├── application.yaml         # Spring Boot config
│   ├── schema-h2.sql            # H2 DDL
│   └── edmx/
│       ├── csn.json             # Generated CDS metadata
│       └── odata/               # Generated OData schemas
├── target/
│   ├── classes/
│   │   ├── application.yaml
│   │   ├── schema-h2.sql
│   │   ├── customer/...         # Compiled Java classes
│   │   ├── cds/gen/...          # Generated OData services
│   │   └── edmx/                # Generated metadata
│   └── estudos-sap-btp-buildcode-java-1-1.0.0.jar
└── code/  [Node.js fallback handlers, not used in Java runtime]
```

### Build Process

```
mvn clean install
     │
     ├─▶ Generate: CDS→Java services
     │   (srv/src/gen/java contains generated classes)
     │
     ├─▶ Compile: Java code, custom LocalSecurityConfiguration
     │
     ├─▶ Package: JAR with embedded Tomcat
     │
     ▼
target/estudos-*-1.0.0.jar  [Executable Spring Boot JAR]
```

### Runtime Startup

```
java -jar target/estudos-*.jar
     │
     ├─▶ Spring Boot initializes
     │
     ├─▶ CdsDataLoader scans db/data/*.csv
     │   │
     │   └─▶ Loads Customers, Products, Purchases, Redemptions
     │
     ├─▶ Database initialized (H2 in-memory)
     │
     ├─▶ Spring Security configured
     │   │
     │   ├─▶ LocalSecurityConfiguration scoped to /ui, /service, /odata
     │   │
     │   └─▶ MockUsersSecurityConfig for fallback
     │
     ├─▶ OData service endpoints exposed
     │
     ▼
Application ready at http://localhost:8080/
```

### Key Configuration Files

**application.yaml** (Spring Boot config):
```yaml
spring:
  application:
    name: estudos-sap-btp-buildcode-java-1
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
server:
  port: 8080
  servlet:
    context-path: /
```

**schema-h2.sql** (Generated from CDS):
```sql
CREATE TABLE Customers (
  ID UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  totalPurchaseValue DECIMAL(15,2),
  totalRewardPoints DECIMAL(15,2)
);

CREATE TABLE Products (
  ID UUID PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(15,2)
);

CREATE TABLE Purchases (
  ID UUID PRIMARY KEY,
  purchaseValue DECIMAL(15,2),
  rewardPoints DECIMAL(15,2),
  customerID UUID REFERENCES Customers(ID),
  productID UUID REFERENCES Products(ID),
  createdAt TIMESTAMP
);

CREATE TABLE Redemptions (
  ID UUID PRIMARY KEY,
  customerID UUID REFERENCES Customers(ID),
  rewardPointsRedeemed DECIMAL(15,2),
  redeemedAt TIMESTAMP
);
```

---

## Deployment Architecture

### Multi-Target Application (mta.yaml)

```yaml
ID: estudos-sap-btp-buildcode-java-1
version: 1.0.0

modules:
  - name: estudos-sap-btp-buildcode-java-1-srv  # Java backend
    type: java
    path: srv
    provides:
      - name: srv_api
        public: true
        properties:
          url: ${default-url}
    requires:
      - name: db                          # Database service

  - name: estudos-sap-btp-buildcode-java-1-app  # UI5 frontend
    type: html5
    path: app/com.estudos.buildcode.java1.ui

resources:
  - name: db                              # Managed database service
    type: org.cloudfoundry.managed-service
    parameters:
      service: postgresql
      plan: standard  # or: hdi-shared
```

### Local Development Deployment

**Running locally** (no Cloud Foundry):
```bash
cd srv
mvn spring-boot:run -q

# Application starts on localhost:8080
# H2 in-memory database automatically initialized
# CSV seed data loaded
# OData endpoints ready
```

### Cloud Foundry Deployment

**Build for Cloud**:
```bash
npm install
mvn -f srv/pom.xml clean package

npm run build  # Generates MTA
# or
mbt build      # Creates .mtar file
```

**Deploy to Cloud**:
```bash
cf login -a https://api.cf.<region>.hana.ondemand.com
cf target -o <org> -s <dev>

cf deploy estudos-sap-btp-buildcode-java-1_1.0.0.mtar

# Cloud Foundry:
# 1. Extracts modules
# 2. Creates PostgreSQL service instance (if not exists)
# 3. Builds Java JAR
# 4. Deploys to Cloud Foundry runtime
# 5. Binds database service
# 6. Injects XSUAA config
# 7. Application starts
```

**Application URL** (after deployment):
```
https://estudos-sap-btp-buildcode-java-1-<space>-<org>.cfapps.<region>.hana.ondemand.com
```

### Environment Differences

| Aspect | Local Development | Cloud Foundry |
|--------|------------------|---------------|
| Database | H2 in-memory | PostgreSQL managed service |
| Authentication | Mock user enabled | XSUAA OAuth2 |
| Startup Time | ~5-10 seconds | ~30-60 seconds |
| Seed Data | Loaded from CSV | Pre-populated or loaded on first run |
| Security Config | LocalSecurityConfiguration | Auto-applied by Spring Cloud |
| Logs | stdout/stderr | `cf logs <app-name>` |
| Scaling | NA | Can scale multiple instances |

---

## Known Limitations & Workarounds

### Limitation 1: Non-Draft Entities
**Issue**: Simplified entity model without draft states may lose concurrent edit history
**Workaround**: Add audit columns (createdAt, modifiedAt, modifiedBy) if needed
**Status**: Acceptable for this use case (no concurrent editing scenario)

### Limitation 2: Client-Side Reward Calculation
**Issue**: Reward points calculated on frontend (10% hardcoded), not on backend
**Concern**: Potential for tampering
**Workaround**: Move calculation to backend handler (before-create hook on Purchases)
**Status**: Acceptable for demonstration; production should validate on backend

### Limitation 3: In-Memory H2 Database
**Issue**: All data lost when JVM terminates (local development)
**Workaround**: Use persistent H2 (file-based) for local testing longer than session
**Status**: Expected behavior for dev; Cloud Foundry uses persistent PostgreSQL

### Limitation 4: Mock User in Cloud
**Issue**: LocalSecurityConfiguration currently permits all users in local profile
**Risk**: If profile doesn't switch in cloud, authentication bypassed
**Workaround**: Verify `@Profile("default")` only applies to local environment
**Status**: Properly isolated; Cloud Foundry uses different profiles

### Limitation 5: CSV Seeding Only on Startup
**Issue**: Cannot reload seed data without restarting application
**Workaround**: Implement `/api/reset-data` endpoint for testing
**Status**: Acceptable for demo; add if needed for dev workflows

### Limitation 6: No Soft Delete
**Issue**: DELETE operations permanently remove records (no trash/undo)
**Workaround**: Add isDeleted flag column, use soft delete pattern
**Status**: Acceptable for demo; implement for production

---

## Performance Considerations

### Frontend
- **Model Size**: JSONModel holds entire dataset in memory
  - Acceptable for 1000s of records
  - Beyond 10k records, consider pagination
  
- **Network**: Each navigate() call triggers OData fetch
  - Round-trip times: ~200-500ms on local network
  - Acceptable for this application

### Backend
- **OData Expansion**: Avoid deep $expand (multiple levels)
  - Current use case: single-level expand (customers → purchases)
  - No N+1 query issues due to CAP optimizations

- **Database**: H2 in-process, PostgreSQL in cloud
  - Query performance: <50ms for typical operations
  - No indexing needed for current dataset sizes

### Scalability Recommendations
1. Add pagination ($skip/$top) for large lists (>1k records)
2. Implement lazy loading for detail views
3. Cache frequently-accessed dropdowns (products, customer lists)
4. Monitor database response times in production

---

## Development Workflow

### Adding a New Feature

1. **Define in CDS** (`db/schema.cds`)
   ```cds
   entity NewEntity {
       key ID : UUID;
       name : String;
   }
   ```

2. **Expose in Service** (`srv/service.cds`)
   ```cds
   entity NewEntity as projection on db.NewEntity;
   ```

3. **Implement UI** (`Main.view.xml`, `Main.controller.js`)
   ```javascript
   onOpenNewEntity() {
       this._loadNewEntities();
       this.getView().getController()._oApp.to("newEntityPage");
   }
   ```

4. **Build & Test**
   ```bash
   mvn clean install
   cd srv && mvn spring-boot:run -q
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add new entity"
   ```

### Debugging Tips

- **Browser DevTools**: `F12` → Network tab to see OData requests/responses
- **Backend Logs**: Check Java console output for Spring Boot startup messages
- **Database**: `H2 Console` at `http://localhost:8080/h2-console` (if enabled)
- **OData Metadata**: `http://localhost:8080/odata/v4/service/estudos_buildcode_java_1_cds/$metadata`

---

## Testing Strategy

### Unit Tests (Backend)
- Spring Boot Test framework
- Mock OData repositories
- Verify business logic handlers

### Integration Tests (Frontend)
- SAPUI5 view/controller tests
- Mock OData responses
- Verify navigation flows

### E2E Tests (Full Stack)
- Selenium/Playwright
- Real application instance
- User workflow validation

### Current Status
- No automated tests in this project
- Manual testing sufficient for demo
- Recommend adding for production

---

## Continuous Integration / Continuous Deployment

### Git Workflow
```
main branch (production-ready)
     │
     ├─▶ feature/... branch
     │   ├─▶ Local testing
     │   └─▶ Pull request
     │
     └─▶ Code review + merge
         │
         ├─▶ CI pipeline runs tests
         │
         └─▶ Deploy to Cloud Foundry (automatic or manual)
```

### Recommended CI/CD Setup

**GitHub Actions** (example):
```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: '21'
      - uses: actions/setup-node@v2
        with:
          node-version: '22'
      - run: mvn clean install
      - run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: cloudfoundry/cf-cli-installer@v2
      - run: cf deploy estudos-sap-btp-buildcode-java-1_1.0.0.mtar
        env:
          CF_API: ${{ secrets.CF_API }}
          CF_ORG: ${{ secrets.CF_ORG }}
          CF_SPACE: ${{ secrets.CF_SPACE }}
          CF_USERNAME: ${{ secrets.CF_USERNAME }}
          CF_PASSWORD: ${{ secrets.CF_PASSWORD }}
```

---

## Maintenance & Support

### Regular Tasks
- Monitor application logs in Cloud Foundry production
- Review database size and performance
- Update Maven dependencies (quarterly)
- Backup production database (automatic with Cloud Foundry managed services)

### Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized on UI | Verify LocalSecurityConfiguration present and @Order(0) |
| OData POST returns 400 | Check request Content-Type header and JSON format |
| Purchases filter not working | Verify customer number input binding and onGoPurchases() event |
| Data lost on restart (local) | Switch to file-based H2: `jdbc:h2:file:./data/db` |
| Slow OData queries | Check $expand usage, avoid multiple levels of nesting |

---

**Document Version**: 1.0  
**Last Updated**: March 2026  
**Maintainer**: Development Team
