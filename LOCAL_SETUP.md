# Local Development Setup Guide

This SAP CAP project with Java backend can be run locally on your machine.

## Prerequisites

Before you start, ensure you have installed:

1. **Java 21** - Required by the project
   ```bash
   java -version
   ```
   Should show version 21.x.x

2. **Node.js (v18+)** - For CDS and frontend
   ```bash
   node --version
   npm --version
   ```

3. **Maven 3.6+** - For building Java services
   ```bash
   mvn --version
   ```

If you're missing any of these, install them before proceeding.

## Quick Start

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install CAP development kit globally (optional but recommended)
npm install -g @sap/cds-dk
```

### 2. Build the Java Service

```bash
cd srv
mvn clean package -DskipTests=true
cd ..
```

### 3. Run Locally

Using CDS CLI:
```bash
cds watch
```

This will:
- Start the CDS development server on `http://localhost:4004`
- Compile your data model and services
- Auto-reload on file changes
- Initialize the H2 in-memory database with sample data

### 4. Access the Application

- **Service Root**: http://localhost:4004
- **Catalog**: http://localhost:4004/$service/default/
- **OData Services**: http://localhost:4004/odata/v4/...

## Project Structure

- **`app/`** - Fiori UI content
- **`db/`** - Data models (CDS)
- **`srv/`** - Service layer (Java Spring Boot + CDS)
  - `src/main/java/` - Java custom code
  - `src/main/resources/` - Configuration and SQL scripts
  - `service.cds` - OData service definitions
- **`test/data/`** - Sample data (CSV files)

## Troubleshooting

### Port 4004 Already in Use
Change the port:
```bash
cds watch --port 5000
```

### Java Not Found
Ensure Java 21 is in your PATH and is the default:
```bash
java -version
javac -version
```

### Dependencies Not Installing
Clear npm cache and retry:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Maven Build Fails
Check your JAVA_HOME is set to Java 21:
```bash
export JAVA_HOME=/path/to/java21
mvn clean package
```

## Development Tips

- **Auto-reload enabled**: Changes to `.cds`, `.js`, and HTML files auto-reload
- **Debug Java code**: Add breakpoints in your IDE and attach debugger to port 9229
- **Reset Database**: Kill the process and restart — H2 is in-memory so data resets
- **View Sample Data**: Check `test/data/` for imported CSV files

## Next Steps

1. Explore the data model: `db/schema.cds`
2. Check service definitions: `srv/service.cds`
3. Review custom business logic: `srv/code/` and `srv/src/main/java/`
4. Build your UI in `app/`

Happy coding! 🚀
