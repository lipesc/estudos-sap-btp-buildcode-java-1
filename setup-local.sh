#!/bin/bash

# Local Development Setup Script for SAP CAP Java Project
# This script sets up and runs the project locally

set -e

echo "================================================"
echo "SAP CAP Java Project - Local Setup"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java not found. Please install Java 21${NC}"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=version ")[\d.]+' | head -1)
echo -e "${GREEN}✓ Java found: $JAVA_VERSION${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js v18+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"

# Check Maven
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}✗ Maven not found. Please install Maven 3.6+${NC}"
    exit 1
fi

MVN_VERSION=$(mvn --version 2>&1 | head -n 1)
echo -e "${GREEN}✓ Maven found${NC}"

echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"

# Install Node dependencies
echo "Installing Node.js packages..."
npm install

echo ""
echo -e "${YELLOW}Building Java service...${NC}"

# Build Java service
cd srv
echo "Running Maven build..."
mvn clean package -DskipTests=true --batch-mode -q
cd ..

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "To start the development server, run:"
echo -e "${YELLOW}  cds watch${NC}"
echo ""
echo "The application will be available at:"
echo -e "${YELLOW}  http://localhost:4004${NC}"
echo ""
