# Estudos SAP BTP - BuildCode Java 1

A full-stack SAP enterprise application built with **CAP (Cloud Application Programming)** framework, featuring a modern SAPUI5 frontend and Java Spring Boot backend. This project demonstrates customer and purchase management with real-time reward calculation and persistence.

## 🎯 Overview

This application provides:
- **Customer Management**: View, create, and manage customer profiles with reward tracking
- **Purchase Management**: Record purchases, automatically calculate reward points (10% of purchase value)
- **Product Catalog**: Browse available products for selection during purchase creation
- **Redemption Tracking**: Monitor customer reward redemptions
- **Real-time Updates**: Seamless data synchronization with immediate backend persistence

## 🏗️ Architecture

### Technology Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend** | Java Spring Boot | 3.5.8 |
| **Frontend** | SAPUI5 | 1.146 |
| **Framework** | SAP CAP | 4.6.1 |
| **Database** | H2 (Local) / Cloud Foundry PostgreSQL | In-Memory |
| **Build Tool** | Maven | 3.8.1+ |
| **Runtime** | Node.js / JVM 21 | v22 / Java 21 |
| **OData Protocol** | OData V4 | Latest |

### Project Structure

```
estudos-sap-btp-buildcode-java-1/
├── app/                           # SAPUI5 Frontend
│   └── com.estudos.buildcode.java1.ui/
│       └── webapp/
│           ├── controller/        # UI5 Controllers
│           │   └── Main.controller.js
│           ├── view/              # XML Views
│           │   └── Main.view.xml
│           ├── img/               # Assets (SAP logo)
│           ├── index.html         # Entry point
│           └── manifest.json      # App descriptor
├── db/                            # Data & Model Layer
│   ├── schema.cds                 # Entity definitions
│   ├── data/                      # CSV seed data
│   │   ├── estudos_buildcode_java_1_cds-Customers.csv
│   │   ├── estudos_buildcode_java_1_cds-Products.csv
│   │   ├── estudos_buildcode_java_1_cds-Purchases.csv
│   │   └── estudos_buildcode_java_1_cds-Redemptions.csv
│   └── package.json
├── srv/                           # Service Layer
│   ├── service.cds                # OData service definition
│   ├── service.js                 # Custom handlers (Node.js)
│   ├── code/                      # Hook implementations
│   │   ├── before-purchases-create-update.js
│   │   └── on-redemptions-update.js
│   ├── src/
│   │   └── main/java/customer/   # Java backend implementation
│   │       └── estudos_buildcode_java_1/
│   │           ├── LocalSecurityConfiguration.java  # Spring Security config
│   │           └── [generated CDS services]
│   └── pom.xml
├── mta.yaml                       # Multi-target app descriptor
└── pom.xml                        # Root Maven config
```

## ✨ Features

### Multi-Page UI5 Application
- **Launchpad Homepage**: Tile-based navigation to Customers, Purchases, and Redemptions
- **Purchases List**: Filter by customer number, view all purchase details
- **Create Purchase**: Form with auto-calculated reward points (10% of value)
- **Customers View**: Display customer totals including purchase value and reward points
- **Shell Navigation**: Seamless page-to-page navigation with state management

### Backend OData Service
- **Customers Entity Set**: CRUD operations with aggregated totals
- **Products Entity Set**: Product catalog for selection
- **Purchases Entity Set**: Purchase records with automatic reward calculation
- **Redemptions Entity Set**: Track customer redemption history
- **Real-time Persistence**: All data updates immediately saved to backend database

### Security & Authentication
- Local Development: Mock user authentication ("authenticated:" user)
- Production: SAP XSUAA integration via Cloud Foundry
- Spring Security configuration scoped to permit UI and service routes

## 🚀 Quick Start

### Prerequisites
- **Node.js** v22 or higher
- **Java** 21 JDK
- **Maven** 3.8.1 or higher
- **SAP Cloud Foundry CLI** (for deployment)
- **Git** 2.0+

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd estudos-sap-btp-buildcode-java-1
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   cd srv && npm install && cd ..
   cd app/com.estudos.buildcode.java1.ui && npm install && cd ../../..
   ```

3. **Build with Maven**
   ```bash
   mvn clean install
   ```

4. **Start the local development server**
   ```bash
   cd srv
   mvn spring-boot:run -q
   ```
   The application will start on `http://localhost:8080`

5. **Open the application**
   - Navigate to: `http://localhost:8080/com.estudos.buildcode.java1.ui/webapp/index.html`
   - Login with any username (mock auth accepts all users, empty password)

### Local Testing Workflow

1. **Navigate to Purchases** → Click "Create" button
2. **Fill in the form**:
   - Purchase Value: 1200
   - Customer: Select any customer (e.g., Maria)
   - Product: Select any product
   - Reward Points auto-calculates (10% of purchase value)
3. **Click "Create"** → Data persists to H2 database
4. **Navigate to Customers** → See updated totals
5. **Refresh browser** → Values persist (via backend PATCH update)

## 📦 Data Seeding

The application loads initial sample data from CSV files during startup:
- **Customers**: 5 default customers (Maria, John, etc.)
- **Products**: Sample products for purchase
- **Purchases**: Initial purchase history
- **Redemptions**: Sample redemption records

Seed files are located in `db/data/` and loaded automatically by the CAP CsvDataLoader.

## 🔌 OData Service Endpoints

### Base URL (Local Development)
```
http://localhost:8080/odata/v4/service/estudos_buildcode_java_1_cds/
```

### Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/Customers` | List all customers |
| POST | `/Customers` | Create new customer |
| GET | `/Customers(<ID>)` | Get customer details |
| PATCH | `/Customers(<ID>)` | Update customer |
| GET | `/Purchases` | List all purchases |
| POST | `/Purchases` | Create purchase (triggers reward calculation) |
| GET | `/Products` | List available products |
| POST | `/Redemptions` | Record redemption |

### Example Request: Create Purchase
```bash
curl -X POST http://localhost:8080/odata/v4/service/estudos_buildcode_java_1_cds/Purchases \
  -H "Authorization: Basic YXV0aGVudGljYXRlZDo=" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseValue": 1200,
    "rewardPoints": 120,
    "customerID": "<customer-uuid>",
    "productID": "<product-uuid>"
  }'
```

## 🛠️ Development

### Build Commands
```bash
# Build the entire project
mvn clean install

# Run only tests
mvn test

# Build without running tests
mvn clean install -DskipTests

# Start development server with live reload
cd srv && mvn spring-boot:run -q
```

### Code Structure

**Frontend (SAPUI5)**
- `Main.controller.js`: Handles all UI logic, OData calls, form submission
- `Main.view.xml`: Defines UI5 pages and controls
- Uses JSONModel for client-side data binding

**Backend (Java/CAP)**
- `service.cds`: Defines OData entities and service projections
- `LocalSecurityConfiguration.java`: Spring Security configuration for local development
- Generated CDS services automatically provide CRUD operations

### Key Implementation Details

**Purchase Creation Flow**:
1. User fills form and clicks "Create"
2. `onSavePurchase()` calculates reward points (purchaseValue × 0.1)
3. POST request sent to `/Purchases` OData endpoint
4. Backend creates purchase record
5. PATCH request updates customer totals (totalPurchaseValue, totalRewardPoints)
6. UI reloads all models to reflect changes
7. User navigated to updated view

**Data Persistence**:
- All CRUD operations use OData V4 protocol
- Backend automatically persists to H2 database
- Customer totals aggregated via PATCH operations
- Entities defined without draft enablement for simplified transaction handling

## 📱 Integration with SAP Build Online

### Prerequisites
- Active SAP BTP account with buildCode app enabled
- SAP Cloud Foundry space configured

### Import Process

1. **Export the project**
   ```bash
   # Package the application
   npm run build
   ```

2. **Access SAP Build Online**
   - Navigate to your SAP BTP landscape
   - Open the **buildCode** application

3. **Import Project**
   - Click "Import Project"
   - Select "From Git Repository"
   - Enter repository URL: `https://github.com/<your-org>/estudos-sap-btp-buildcode-java-1`
   - Click "Import"

4. **Configure Database**
   - In buildCode editor, navigate to data model
   - Verify all tables (Customers, Products, Purchases, Redemptions)
   - Set up cloud database bindings (PostgreSQL recommended)

5. **Deploy to Cloud Foundry**
   - Click "Deploy"
   - Select target Cloud Foundry space
   - Application deploys with UI and backend services

### Using buildCode UI Editor
- **Entity Modeler**: Visual entity diagram and relationships
- **OData UI**: Auto-generated UI for all entities
- **Data Manager**: Browse and edit seed data directly
- **API Browser**: Test OData endpoints with built-in client

## ☁️ Cloud Foundry Deployment

### Prerequisites
- Cloud Foundry CLI (`cf` command)
- Access to SAP BTP Cloud Foundry environment
- Database service (PostgreSQL or SAP HANA)

### Deployment Steps

1. **Prepare for deployment**
   ```bash
   # Clear local build artifacts
   mvn clean
   ```

2. **Update mta.yaml for cloud environment**
   ```yaml
   # Optional: Configure database service binding
   # Example for PostgreSQL:
   resources:
     - name: db
       type: org.cloudfoundry.managed-service
       parameters:
         service: postgresql
         plan: standard
   ```

3. **Build MTA archive**
   ```bash
   npm run build
   # or
   mbt build
   ```

4. **Login to Cloud Foundry**
   ```bash
   cf login -a https://api.cf.<region>.hana.ondemand.com
   cf target -o <org> -s <space>
   ```

5. **Deploy the application**
   ```bash
   cf deploy mta_archives/estudos-sap-btp-buildcode-java-1_1.0.0.mtar
   ```

6. **Verify deployment**
   ```bash
   cf apps
   # Application should show as "started"
   
   # Access Application:
   # https://<app-name>-<space>.<cf-domain>/com.estudos.buildcode.java1.ui/webapp/index.html
   ```

### Environment Configuration
- Database is automatically configured via Cloud Foundry service bindings
- Authentication uses SAP XSUAA (no mock users in production)
- Logs accessible via: `cf logs <app-name>`

### Post-Deployment
- Verify all entities load: Check browser console, no 401 errors
- Test CRUD operations on all entities
- Monitor application logs for any warnings
- Configure CI/CD pipeline for automated deployments

## 🔐 Security Considerations

### Local Development
- Mock authentication enabled (any username, empty password)
- Spring Security scoped to permit UI routes without challenge
- Suitable for development only, **NOT** for production

### Cloud Foundry
- XSUAA integration provides enterprise security
- OAuth2/OpenID Connect authentication flow
- Role-based access control via SAP role collections
- All communications encrypted via TLS

## 📊 Database

### Local Development (H2)
- In-memory database, data persists during session
- Automatically populated with seed data from CSV files
- Suitable for development and testing

### Cloud Foundry (PostgreSQL)
```yaml
# In mta.yaml:
- name: db
  type: org.cloudfoundry.managed-service
  parameters:
    service: postgresql
    plan: standard
```

### Data Model

**Customers**
- ID (UUID, Primary Key)
- Name (String)
- Email (String)
- TotalPurchaseValue (Decimal)
- TotalRewardPoints (Decimal)

**Products**
- ID (UUID, Primary Key)
- Name (String)
- Price (Decimal)

**Purchases**
- ID (UUID, Primary Key)
- PurchaseValue (Decimal)
- RewardPoints (Decimal, auto-calculated as PurchaseValue × 0.1)
- CustomerID (Foreign Key → Customers)
- ProductID (Foreign Key → Products)
- CreatedAt (DateTime)

**Redemptions**
- ID (UUID, Primary Key)
- CustomerID (Foreign Key → Customers)
- RewardPointsRedeemed (Decimal)
- RedeemedAt (DateTime)

## 🐛 Troubleshooting

### Port 8080 Already in Use
```bash
# Find and kill process on port 8080
lsof -i :8080
kill -9 <PID>

# Or use a different port:
mvn spring-boot:run -q -Dspring-boot.run.arguments="--server.port=8081"
```

### UI Returns 401 Unauthorized
- Ensure `LocalSecurityConfiguration.java` is present in `srv/src/main/java/customer/`
- Verify Application started with Spring Boot, not regular Java
- Check browser console for auth header errors

### Data Not Persisting
- Verify H2 database is running (check logs for "H2 Console")
- Confirm CSV seed files exist in `db/data/`
- Check database schema matches CDS entity definitions

### Purchases Filter Not Working
- Ensure `onGoPurchases()` event handler is properly bound
- Check that customer number input has correct binding
- Verify OData filter parameter syntax in controller

## 📚 Additional Resources

- [SAP CAP Documentation](https://cap.cloud.sap/)
- [SAPUI5 Developer Guide](https://sapui5.hana.ondemand.com/)
- [OData V4 Standard](https://www.odata.org/)
- [SAP BTP Learning Paths](https://learning.sap.com/learning-journeys/sap-btp)
- [Cloud Foundry CLI Reference](https://docs.cloudfoundry.org/cf-cli/)

## 📝 License

This project is provided as-is for educational and demonstration purposes.

## 👥 Contributors

- Initial development: SAP buildCode Java 1 Study Project

---

**Last Updated**: March 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
