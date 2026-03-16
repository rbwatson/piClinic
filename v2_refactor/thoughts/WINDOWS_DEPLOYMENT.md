# piClinc Windows Deployment Guide

## Executive Summary

This document extends the piClinc refactoring plan to support deployment on **Windows PCs** in addition to Raspberry Pi and Ubuntu Linux. This enables:

✅ **Standalone deployment** - Server + UI on a single Windows PC
✅ **Multi-PC deployment** - Server on one PC, accessed from other PCs on the network
✅ **Personal computer hosting** - Run on staff member's personal computer
✅ **Flexible deployment** - Mix of Windows, Linux, and Pi deployments

**Key Requirements:**
- Minimum: Windows 10 or Windows 11
- Recommended: Windows 10 Pro or higher (for better service management)
- RAM: 4GB minimum, 8GB recommended
- Disk: 10GB available space
- Network: For multi-PC setup

---

## Table of Contents

1. [Deployment Scenarios](#deployment-scenarios)
2. [Architecture Changes](#architecture-changes)
3. [Windows Stack Options](#windows-stack-options)
4. [Installation Guide](#installation-guide)
5. [Configuration for Multi-PC Access](#configuration-for-multi-pc-access)
6. [Cross-Platform Code Considerations](#cross-platform-code-considerations)
7. [Migration from Linux to Windows](#migration-from-linux-to-windows)
8. [Troubleshooting](#troubleshooting)

---

## Deployment Scenarios

### Scenario 1: Standalone Windows PC

**Use Case:** Single-user clinic or demo installation

```
┌─────────────────────────────────┐
│      Windows PC (Laptop/Desktop) │
│  ┌────────────────────────────┐ │
│  │  MySQL Database            │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │  Apache + PHP API          │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │  React Frontend (browser)  │ │
│  └────────────────────────────┘ │
│                                 │
│  Access: http://localhost/      │
└─────────────────────────────────┘
```

**Benefits:**
- Simple setup
- No network configuration needed
- Works offline
- Good for testing/training

### Scenario 2: Multi-PC Network Deployment

**Use Case:** Clinic with multiple workstations

```
                    Local Network (192.168.1.x)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼─────────┐
│ Server PC      │  │ Workstation 1  │  │ Workstation 2  │
│ Windows 10+    │  │ Windows/Mac    │  │ Windows/Mac    │
│                │  │                │  │                │
│ • MySQL        │  │ • Browser only │  │ • Browser only │
│ • Apache/PHP   │  │ • React app    │  │ • React app    │
│ • React files  │  │                │  │                │
│                │  │                │  │                │
│ IP: 192.168.1.10│ │ Access:        │  │ Access:        │
│                │  │ http://        │  │ http://        │
│                │  │ 192.168.1.10/  │  │ 192.168.1.10/  │
└────────────────┘  └────────────────┘  └────────────────┘
```

**Benefits:**
- Multiple concurrent users
- Centralized data
- Use existing PCs
- No dedicated server hardware needed

### Scenario 3: Hybrid Deployment

**Use Case:** Mix Windows and Linux systems

```
┌──────────────────┐          ┌──────────────────┐
│  Windows Server  │          │  Raspberry Pi    │
│  (Main clinic)   │◄────────►│  (Remote site)   │
│                  │ Backup/  │                  │
│  http://         │  Sync    │  http://         │
│  clinic-main/    │          │  clinic-remote/  │
└──────────────────┘          └──────────────────┘
         │
         │ Network
         │
    ┌────▼─────┐
    │ Client   │
    │ Browsers │
    └──────────┘
```

**Benefits:**
- Flexibility in hardware choices
- Can use existing infrastructure
- Gradual migration path

---

## Architecture Changes

### File Path Differences

| Component | Linux/Pi | Windows |
|-----------|----------|---------|
| **Application Root** | `/var/www/html/` | `C:\piclinic\` or `C:\xampp\htdocs\piclinic\` |
| **Config Files** | `/var/www/pass/` | `C:\piclinic\config\` |
| **Database Data** | `/var/lib/mysql/` | `C:\xampp\mysql\data\` or `C:\ProgramData\MySQL\` |
| **Logs** | `/var/log/piclinic/` | `C:\piclinic\logs\` |
| **Backups** | `/var/local/piclinic/backups/` | `C:\piclinic\backups\` |
| **Images** | `/var/local/piclinic/images/` | `C:\piclinic\images\` |

### Service Management

| Task | Linux/Pi | Windows |
|------|----------|---------|
| **Start Apache** | `systemctl start apache2` | `net start Apache2.4` or XAMPP Control Panel |
| **Start MySQL** | `systemctl start mysql` | `net start MySQL` or XAMPP Control Panel |
| **Auto-start** | `systemctl enable apache2` | Windows Services (sc config) |
| **Check Status** | `systemctl status apache2` | `sc query Apache2.4` or Services.msc |

### Script Languages

| Purpose | Linux/Pi | Windows |
|---------|----------|---------|
| **Installation** | Bash scripts | PowerShell + Batch files |
| **Migration** | Bash scripts | PowerShell scripts |
| **Backup** | Bash scripts | PowerShell scripts |

---

## Windows Stack Options

### Option A: XAMPP (Recommended for Windows)

**What is XAMPP?**
- Apache + MySQL + PHP + Perl bundled installer
- Easy installation and management
- Control panel for starting/stopping services
- Cross-platform (Windows, Mac, Linux)

**Pros:**
- ✅ Easiest installation (one installer)
- ✅ GUI control panel
- ✅ Pre-configured for development
- ✅ Widely used and documented
- ✅ Free and open source

**Cons:**
- ⚠️ Not optimized for production
- ⚠️ May need security hardening
- ⚠️ Default settings need adjustment

**Download:** https://www.apachefriends.org/

### Option B: Individual Components

**Components:**
- Apache HTTP Server for Windows
- MySQL Community Server
- PHP for Windows

**Pros:**
- ✅ More control over configuration
- ✅ Production-ready setup possible
- ✅ Latest versions of each component

**Cons:**
- ⚠️ More complex installation
- ⚠️ Manual configuration required
- ⚠️ More technical expertise needed

### Option C: WAMP/WampServer

**What is WAMP?**
- Windows + Apache + MySQL + PHP
- Similar to XAMPP
- Popular in Windows environments

**Pros:**
- ✅ Easy installation
- ✅ Windows-optimized
- ✅ GUI management

**Cons:**
- ⚠️ Less cross-platform than XAMPP

### Recommendation Matrix

| Scenario | Recommended Stack | Rationale |
|----------|------------------|-----------|
| **Development/Testing** | XAMPP | Quick setup, easy management |
| **Single PC clinic** | XAMPP | Sufficient performance, easy for non-technical staff |
| **Multi-PC clinic (< 10 users)** | XAMPP on dedicated PC | Good performance, manageable |
| **Multi-PC clinic (10+ users)** | Individual components | Better performance, can optimize |
| **Enterprise/Large clinic** | Consider Linux/Pi or Windows Server | Better for scale |

---

## Installation Guide

### XAMPP Installation (Recommended)

#### Step 1: Download and Install XAMPP

```powershell
# Download XAMPP (can be automated with PowerShell)
# Or download manually from: https://www.apachefriends.org/

# Run installer
# 1. Choose components: Apache, MySQL, PHP, phpMyAdmin
# 2. Install to: C:\xampp (default) or C:\piclinic-server
# 3. Launch Control Panel after installation
```

#### Step 2: Configure XAMPP

**A. Start Services**

Open XAMPP Control Panel:
1. Start Apache (port 80, 443)
2. Start MySQL (port 3306)
3. Click "Service" buttons to install as Windows Services (auto-start)

**B. Configure PHP**

Edit `C:\xampp\php\php.ini`:

```ini
; Enable extensions
extension=mysqli
extension=mbstring
extension=openssl

; Upload limits (for patient images)
upload_max_filesize = 2M
post_max_size = 8M

; Timezone
date.timezone = America/New_York

; Error reporting (production)
display_errors = Off
log_errors = On
error_log = C:\xampp\php\logs\php_error.log

; Memory limit
memory_limit = 256M
```

**C. Configure Apache**

Edit `C:\xampp\apache\conf\httpd.conf`:

```apache
# Enable mod_rewrite for API routing
LoadModule rewrite_module modules/mod_rewrite.so

# Document root
DocumentRoot "C:/xampp/htdocs/piclinic"
<Directory "C:/xampp/htdocs/piclinic">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

**D. Configure Virtual Host (optional, for multi-PC access)**

Edit `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:

```apache
<VirtualHost *:80>
    ServerName piclinic.local
    DocumentRoot "C:/xampp/htdocs/piclinic"

    <Directory "C:/xampp/htdocs/piclinic">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # React SPA
    <Directory "C:/xampp/htdocs/piclinic/app">
        FallbackResource /app/index.html
    </Directory>

    # API
    <Directory "C:/xampp/htdocs/piclinic/api">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "C:/xampp/apache/logs/piclinic-error.log"
    CustomLog "C:/xampp/apache/logs/piclinic-access.log" common
</VirtualHost>
```

Restart Apache after changes.

#### Step 3: Install piClinc Application

**PowerShell script for automated installation:**

```powershell
# install-piclinic.ps1

# Requires: XAMPP installed at C:\xampp

param(
    [string]$InstallPath = "C:\xampp\htdocs\piclinic",
    [string]$SourcePath = ".\piclinic-v2.0"
)

Write-Host "=== piClinc Windows Installation ===" -ForegroundColor Cyan
Write-Host ""

# Check if XAMPP is installed
if (-not (Test-Path "C:\xampp\apache\bin\httpd.exe")) {
    Write-Host "ERROR: XAMPP not found. Please install XAMPP first." -ForegroundColor Red
    exit 1
}

# Create installation directory
Write-Host "Creating installation directory: $InstallPath"
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

# Copy application files
Write-Host "Copying application files..."
Copy-Item -Path "$SourcePath\www\html\*" -Destination $InstallPath -Recurse -Force

# Create config directory
Write-Host "Creating configuration directory..."
New-Item -ItemType Directory -Force -Path "$InstallPath\config" | Out-Null

# Create logs directory
Write-Host "Creating logs directory..."
New-Item -ItemType Directory -Force -Path "C:\piclinic\logs" | Out-Null

# Create backups directory
Write-Host "Creating backups directory..."
New-Item -ItemType Directory -Force -Path "C:\piclinic\backups" | Out-Null

# Create images directory
Write-Host "Creating images directory..."
New-Item -ItemType Directory -Force -Path "C:\piclinic\images" | Out-Null

# Set permissions (Windows ACLs)
Write-Host "Setting permissions..."
icacls $InstallPath /grant "BUILTIN\Users:(OI)(CI)F" /T

# Deploy React frontend
Write-Host "Deploying React frontend..."
if (Test-Path "$SourcePath\frontend\dist") {
    New-Item -ItemType Directory -Force -Path "$InstallPath\app" | Out-Null
    Copy-Item -Path "$SourcePath\frontend\dist\*" -Destination "$InstallPath\app" -Recurse -Force
} else {
    Write-Host "WARNING: React build not found. Run 'npm run build' in frontend directory first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure database password: $InstallPath\config\dbPass.php"
Write-Host "2. Import database: mysql -u root < sql\piclinic.sql"
Write-Host "3. Start Apache and MySQL in XAMPP Control Panel"
Write-Host "4. Access application: http://localhost/piclinic/"
Write-Host ""
```

Run the installation:

```powershell
# As Administrator
.\install-piclinic.ps1
```

#### Step 4: Setup Database

**A. Create Database**

Using phpMyAdmin (http://localhost/phpmyadmin):
1. Click "New" to create database
2. Name: `piclinic`
3. Collation: `utf8_unicode_ci`

**B. Import Schema**

```powershell
# Using command line
cd C:\xampp\mysql\bin

# Import schema
.\mysql.exe -u root -p piclinic < C:\path\to\piclinic\sql\piclinic.sql

# Create user
.\mysql.exe -u root -p -e "CREATE USER 'CTS-user'@'localhost' IDENTIFIED BY 'your_password';"
.\mysql.exe -u root -p -e "GRANT ALL PRIVILEGES ON piclinic.* TO 'CTS-user'@'localhost';"
.\mysql.exe -u root -p -e "FLUSH PRIVILEGES;"
```

Or use phpMyAdmin:
1. Select `piclinic` database
2. Click "Import"
3. Choose `piclinic.sql` file
4. Click "Go"

#### Step 5: Configure piClinc

**A. Database Password**

Edit `C:\xampp\htdocs\piclinic\config\dbPass.php`:

```php
<?php
// Database password
define('DB_PASS', 'your_password_here', false);
?>
```

**B. Update Configuration Paths**

Edit `C:\xampp\htdocs\piclinic\shared\piClinicConfig.php`:

```php
<?php
// Windows paths (use forward slashes or escaped backslashes)
define('API_LOG_FILEPATH', 'C:/piclinic/logs/', false);
define('API_IMAGE_FILEPATH', 'C:/piclinic/images/', false);
define('API_DELETED_FILEPATH', 'C:/piclinic/deleted/', false);

// Include password
require_once dirname(__FILE__).'/../config/dbPass.php';
```

**C. Test Installation**

1. Open browser: http://localhost/piclinic/
2. Should redirect to login page
3. Default credentials (from test data):
   - Username: `admin`
   - Password: `admin` (change immediately!)

---

## Configuration for Multi-PC Access

### Step 1: Configure Windows Firewall

**Allow Apache through firewall:**

```powershell
# PowerShell (as Administrator)

# Add firewall rule for Apache
New-NetFirewallRule -DisplayName "piClinc Apache HTTP" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 80 `
    -Action Allow `
    -Profile Domain,Private

# For HTTPS (if configured)
New-NetFirewallRule -DisplayName "piClinc Apache HTTPS" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 443 `
    -Action Allow `
    -Profile Domain,Private

# Verify rules
Get-NetFirewallRule -DisplayName "piClinc*"
```

Or via GUI:
1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" → "New Rule"
3. Rule Type: Port
4. Protocol: TCP, Port: 80
5. Action: Allow the connection
6. Profile: Domain, Private (not Public for security)
7. Name: "piClinc Apache HTTP"

### Step 2: Find Server PC IP Address

```powershell
# Get IP address
ipconfig

# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

### Step 3: Configure Apache for Network Access

**A. Allow remote connections**

Edit `C:\xampp\apache\conf\extra\httpd-xampp.conf`:

```apache
# Find this section and comment it out or modify

# OLD (restricts to localhost only):
# <LocationMatch "^/(?i:(?:xampp|security|licenses|phpmyadmin|webalizer|server-status|server-info))">
#     Require local
# </LocationMatch>

# NEW (allow from local network):
<LocationMatch "^/(?i:(?:xampp|security|licenses|phpmyadmin|webalizer|server-status|server-info))">
    Require ip 192.168.1.0/24
    # Or to allow all:
    # Require all granted
</LocationMatch>
```

**B. Configure virtual host for network access**

Add to `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:

```apache
<VirtualHost *:80>
    # Use IP address or hostname
    ServerName 192.168.1.100

    DocumentRoot "C:/xampp/htdocs/piclinic"

    <Directory "C:/xampp/htdocs/piclinic">
        Options Indexes FollowSymLinks
        AllowOverride All

        # Allow access from local network
        Require ip 192.168.1.0/24
        # Or specific IPs:
        # Require ip 192.168.1.50 192.168.1.51 192.168.1.52
    </Directory>

    <Directory "C:/xampp/htdocs/piclinic/app">
        FallbackResource /app/index.html
    </Directory>

    ErrorLog "C:/xampp/apache/logs/piclinic-error.log"
    CustomLog "C:/xampp/apache/logs/piclinic-access.log" common
</VirtualHost>
```

**C. Restart Apache**

```powershell
# Stop Apache
net stop Apache2.4

# Start Apache
net start Apache2.4

# Or use XAMPP Control Panel
```

### Step 4: Configure MySQL for Network Access (if needed)

**If database queries will come from other PCs:**

Edit `C:\xampp\mysql\bin\my.ini`:

```ini
# Find and comment out bind-address (or change to 0.0.0.0)
# bind-address = 127.0.0.1
bind-address = 0.0.0.0
```

Grant remote access:

```sql
-- Allow CTS-user from any host on local network
GRANT ALL PRIVILEGES ON piclinic.* TO 'CTS-user'@'192.168.1.%' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
```

Add firewall rule:

```powershell
New-NetFirewallRule -DisplayName "MySQL Server" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3306 `
    -Action Allow `
    -Profile Private
```

### Step 5: Set Static IP (Recommended)

**Option A: Configure in Windows**

1. Open "Network Connections"
2. Right-click your network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Choose "Use the following IP address:"
   - IP address: `192.168.1.100` (or your chosen IP)
   - Subnet mask: `255.255.255.0`
   - Default gateway: `192.168.1.1` (your router)
   - DNS: `8.8.8.8` or your router's IP

**Option B: Reserve IP in Router**

More reliable - configure DHCP reservation in router based on MAC address.

### Step 6: Test Network Access

**From another PC on the network:**

1. Open browser
2. Navigate to: `http://192.168.1.100/piclinic/`
3. Should see piClinc login page

**Troubleshooting:**

```powershell
# On server PC - check if Apache is listening
netstat -ano | findstr :80

# From client PC - test connectivity
ping 192.168.1.100
telnet 192.168.1.100 80

# Check firewall rules
Get-NetFirewallRule -DisplayName "piClinc*" | Select-Object -Property DisplayName, Enabled, Action
```

### Step 7: Optional - Configure Hostname

**Instead of using IP address, use a friendly name:**

**Option A: Edit hosts file on each client PC**

Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

```
192.168.1.100    piclinic.local
```

Access via: `http://piclinic.local/`

**Option B: Use mDNS/Bonjour (requires additional software)**

Install Bonjour Print Services, then access via: `http://servername.local/`

---

## Cross-Platform Code Considerations

### Path Handling in PHP

**Problem:** Windows uses backslashes (`\`), Linux uses forward slashes (`/`)

**Solution:** Use cross-platform path functions

```php
<?php
// ❌ BAD - hardcoded paths
define('API_LOG_FILEPATH', '/var/log/piclinic/', false);

// ✅ GOOD - cross-platform
// Option 1: Detect OS
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    define('API_LOG_FILEPATH', 'C:/piclinic/logs/', false);
    define('API_IMAGE_FILEPATH', 'C:/piclinic/images/', false);
} else {
    define('API_LOG_FILEPATH', '/var/log/piclinic/', false);
    define('API_IMAGE_FILEPATH', '/var/local/piclinic/images/', false);
}

// Option 2: Configuration file
// Read from .env or config file
define('API_LOG_FILEPATH', getenv('PICLINIC_LOG_PATH') ?: '/var/log/piclinic/', false);

// Option 3: Use DIRECTORY_SEPARATOR
$logPath = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR;
```

**Best Practice:** Use forward slashes even on Windows - PHP accepts both:

```php
<?php
// This works on both Windows and Linux
define('API_LOG_FILEPATH', 'C:/piclinic/logs/', false);  // Windows
define('API_LOG_FILEPATH', '/var/log/piclinic/', false); // Linux
```

### Configuration Management

**Use environment-specific configuration:**

```php
<?php
// config/platform.php

// Detect platform
$isWindows = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');
$isLinux = !$isWindows;

// Load platform-specific config
if ($isWindows) {
    require_once dirname(__FILE__) . '/config.windows.php';
} else {
    require_once dirname(__FILE__) . '/config.linux.php';
}
```

```php
<?php
// config/config.windows.php

define('API_LOG_FILEPATH', 'C:/piclinic/logs/', false);
define('API_IMAGE_FILEPATH', 'C:/piclinic/images/', false);
define('API_DELETED_FILEPATH', 'C:/piclinic/deleted/', false);
define('ROOT_DIR_PATH', 'C:/xampp/htdocs/piclinic/', false);
```

```php
<?php
// config/config.linux.php

define('API_LOG_FILEPATH', '/var/log/piclinic/', false);
define('API_IMAGE_FILEPATH', '/var/local/piclinic/images/', false);
define('API_DELETED_FILEPATH', '/var/local/piclinic/deleted/', false);
define('ROOT_DIR_PATH', '/var/www/html/', false);
```

### Line Endings

**Problem:** Windows uses CRLF (`\r\n`), Linux uses LF (`\n`)

**Solution:** Configure git to handle line endings:

```bash
# .gitattributes
* text=auto
*.php text eol=lf
*.js text eol=lf
*.sql text eol=lf
*.sh text eol=lf
*.ps1 text eol=crlf
*.bat text eol=crlf
```

### Shell Scripts vs PowerShell

**Provide both versions of utility scripts:**

```
tools/
├── backup.sh              # Linux/Mac
├── backup.ps1             # Windows PowerShell
├── migrate.sh             # Linux/Mac
├── migrate.ps1            # Windows PowerShell
├── install.sh             # Linux/Mac
└── install.ps1            # Windows PowerShell
```

**Example: Backup script in PowerShell**

```powershell
# tools/backup.ps1

param(
    [string]$BackupDir = "C:\piclinic\backups",
    [string]$DBName = "piclinic",
    [string]$DBUser = "CTS-user",
    [string]$DBPassword = ""
)

Write-Host "=== piClinc Backup (Windows) ===" -ForegroundColor Cyan

# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $BackupDir "backup-$timestamp"
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null

# Backup database
Write-Host "Backing up database..."
$mysqldumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
$sqlFile = Join-Path $backupPath "database.sql"

if ($DBPassword) {
    & $mysqldumpPath -u $DBUser -p$DBPassword $DBName > $sqlFile
} else {
    & $mysqldumpPath -u $DBUser $DBName > $sqlFile
}

# Compress
Write-Host "Compressing..."
Compress-Archive -Path $sqlFile -DestinationPath "$backupPath\database.zip"
Remove-Item $sqlFile

# Backup files
Write-Host "Backing up application files..."
$appPath = "C:\xampp\htdocs\piclinic"
Compress-Archive -Path "$appPath\config" -DestinationPath "$backupPath\config.zip"

Write-Host ""
Write-Host "Backup complete: $backupPath" -ForegroundColor Green
```

---

## Migration from Linux to Windows

### Data Migration

**Step 1: Export from Linux**

```bash
# On Linux system
mysqldump -u CTS-user -p piclinic | gzip > piclinic-backup.sql.gz

# Copy configuration
tar -czf config-backup.tar.gz /var/www/pass/

# Copy images
tar -czf images-backup.tar.gz /var/local/piclinic/images/
```

**Step 2: Transfer to Windows**

Use SCP, SFTP, or USB drive to transfer files to Windows PC.

**Step 3: Import to Windows**

```powershell
# Extract SQL backup
# (Use 7-Zip or similar to extract .gz file)

# Import to MySQL
cd C:\xampp\mysql\bin
.\mysql.exe -u root -p piclinic < C:\temp\piclinic-backup.sql

# Extract and copy configuration
# Extract config-backup.tar.gz
# Copy files to C:\xampp\htdocs\piclinic\config\

# Extract and copy images
# Extract images-backup.tar.gz
# Copy files to C:\piclinic\images\
```

### Configuration Adjustments

**Update paths in configuration files:**

```powershell
# PowerShell script to update paths
$configFile = "C:\xampp\htdocs\piclinic\shared\piClinicConfig.php"
$content = Get-Content $configFile -Raw

# Replace Linux paths with Windows paths
$content = $content -replace "/var/log/piclinic/", "C:/piclinic/logs/"
$content = $content -replace "/var/local/piclinic/images/", "C:/piclinic/images/"
$content = $content -replace "/var/local/piclinic/deleted/", "C:/piclinic/deleted/"
$content = $content -replace "/var/www/html/", "C:/xampp/htdocs/piclinic/"

Set-Content $configFile -Value $content
```

---

## Performance Considerations

### Windows vs Linux Performance

**Typical performance on comparable hardware:**

| Metric | Linux/Pi | Windows PC |
|--------|----------|------------|
| **Cold start time** | 5-10s | 10-20s (more services) |
| **Request latency** | 50-100ms | 80-150ms |
| **Memory usage** | Lower | Higher (Windows overhead) |
| **Concurrent users** | 10-20 | 10-20 (with adequate RAM) |

**Recommendations:**
- Use SSD for better performance on Windows
- Allocate at least 4GB RAM (8GB preferred)
- Close unnecessary background applications
- Consider disabling Windows Search indexing for piClinc directories

### Optimization for Windows

**1. Disable Windows Defender scanning for piClinc directories:**

```powershell
# Add exclusions
Add-MpPreference -ExclusionPath "C:\xampp"
Add-MpPreference -ExclusionPath "C:\piclinic"
```

**2. Configure MySQL for better performance:**

Edit `C:\xampp\mysql\bin\my.ini`:

```ini
[mysqld]
# Memory settings
innodb_buffer_pool_size = 512M
key_buffer_size = 128M
max_connections = 50

# Query cache (if MySQL < 8.0)
query_cache_size = 64M
query_cache_limit = 2M

# Logging
slow_query_log = 1
slow_query_log_file = C:/xampp/mysql/data/slow.log
long_query_time = 2
```

**3. Configure Apache for better performance:**

Edit `C:\xampp\apache\conf\extra\httpd-mpm.conf`:

```apache
<IfModule mpm_winnt_module>
    ThreadsPerChild      150
    MaxRequestsPerChild  10000
</IfModule>
```

---

## Backup and Restore on Windows

### Automated Backup Script

```powershell
# tools/scheduled-backup.ps1

param(
    [string]$BackupDir = "C:\piclinic\backups",
    [int]$RetainDays = 30
)

# Create backup
.\backup.ps1 -BackupDir $BackupDir

# Delete old backups
$cutoffDate = (Get-Date).AddDays(-$RetainDays)
Get-ChildItem $BackupDir -Directory | Where-Object {
    $_.CreationTime -lt $cutoffDate
} | Remove-Item -Recurse -Force

Write-Host "Cleanup complete. Backups older than $RetainDays days removed."
```

### Schedule Backups with Task Scheduler

```powershell
# Create scheduled task (run as Administrator)

$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-ExecutionPolicy Bypass -File C:\piclinic\tools\scheduled-backup.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

Register-ScheduledTask -TaskName "piClinc Daily Backup" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Daily backup of piClinc database and files"

Write-Host "Scheduled task created successfully."
```

---

## Troubleshooting

### Common Windows Issues

#### Issue 1: Apache Won't Start - Port 80 in Use

**Symptoms:**
- XAMPP Control Panel shows Apache can't start
- Error: Port 80 already in use

**Diagnosis:**

```powershell
# Find what's using port 80
netstat -ano | findstr :80

# Check for IIS, Skype, or other services
```

**Solutions:**

**A. Stop conflicting service:**

```powershell
# Stop IIS (if installed)
iisreset /stop
Stop-Service W3SVC

# Or disable IIS
sc config W3SVC start= disabled
```

**B. Change Apache port:**

Edit `C:\xampp\apache\conf\httpd.conf`:

```apache
# Change from port 80 to 8080
Listen 8080
ServerName localhost:8080
```

Access via: `http://localhost:8080/piclinic/`

#### Issue 2: MySQL Won't Start

**Symptoms:**
- XAMPP shows MySQL can't start
- Error accessing phpMyAdmin

**Diagnosis:**

```powershell
# Check if port 3306 is in use
netstat -ano | findstr :3306

# Check MySQL logs
Get-Content C:\xampp\mysql\data\*.err -Tail 50
```

**Solutions:**

```powershell
# Stop other MySQL instances
net stop MySQL
net stop MySQL80  # MySQL 8.0

# Or change XAMPP MySQL port
# Edit C:\xampp\mysql\bin\my.ini
# port = 3307
```

#### Issue 3: Permission Denied Errors

**Symptoms:**
- Can't write to log files
- Can't upload images
- Database errors

**Solution:**

```powershell
# Grant full control to directories
icacls C:\piclinic\logs /grant "Users:(OI)(CI)F" /T
icacls C:\piclinic\images /grant "Users:(OI)(CI)F" /T
icacls C:\xampp\htdocs\piclinic /grant "Users:(OI)(CI)F" /T

# Or use XAMPP user
icacls C:\piclinic /grant "BUILTIN\Users:(OI)(CI)F" /T
```

#### Issue 4: Cannot Access from Other PCs

**Symptoms:**
- Works on server PC (localhost)
- Doesn't work from other PCs on network

**Diagnosis:**

```powershell
# On server PC - check IP
ipconfig

# Check firewall
Get-NetFirewallRule -DisplayName "piClinc*"

# Check if Apache is listening on all interfaces
netstat -ano | findstr :80
```

**Solutions:**

1. **Add firewall rule** (see Configuration section)
2. **Check Apache configuration** for network access
3. **Verify client can ping server:**
   ```powershell
   ping 192.168.1.100
   ```

#### Issue 5: Slow Performance

**Symptoms:**
- Pages load slowly
- Database queries timeout

**Solutions:**

```powershell
# 1. Check available RAM
Get-CimInstance Win32_OperatingSystem |
    Select-Object FreePhysicalMemory, TotalVisibleMemorySize

# 2. Close unnecessary applications

# 3. Optimize MySQL (see Performance section)

# 4. Add exclusions to Windows Defender
Add-MpPreference -ExclusionPath "C:\xampp"

# 5. Check disk space
Get-PSDrive C | Select-Object Used,Free
```

---

## Security Considerations for Windows

### 1. Change Default Passwords

```sql
-- Change root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'strong_password_here';

-- Change CTS-user password
ALTER USER 'CTS-user'@'localhost' IDENTIFIED BY 'strong_password_here';

FLUSH PRIVILEGES;
```

### 2. Restrict phpMyAdmin Access

Edit `C:\xampp\apache\conf\extra\httpd-xampp.conf`:

```apache
<Directory "C:/xampp/phpMyAdmin">
    AllowOverride All
    Require ip 127.0.0.1
    # Only allow localhost
</Directory>
```

### 3. Enable HTTPS (Optional but Recommended)

XAMPP includes a self-signed certificate:

1. Enable SSL module in Apache
2. Configure virtual host for HTTPS
3. Force redirect HTTP → HTTPS

### 4. Windows Firewall Rules

Only allow access from trusted network:

```powershell
# Allow only from specific subnet
Set-NetFirewallRule -DisplayName "piClinc Apache HTTP" `
    -RemoteAddress 192.168.1.0/24
```

### 5. Regular Windows Updates

Keep Windows, Apache, MySQL, and PHP updated:

```powershell
# Check for Windows updates
Get-WindowsUpdate

# Install XAMPP updates when available
# Download from: https://www.apachefriends.org/
```

---

## Appendix A: PowerShell Utility Scripts

### Check System Requirements

```powershell
# check-requirements.ps1

Write-Host "=== piClinc System Requirements Check ===" -ForegroundColor Cyan
Write-Host ""

# OS Version
$os = Get-CimInstance Win32_OperatingSystem
Write-Host "Operating System: $($os.Caption) $($os.Version)"
if ($os.Caption -match "Windows 10|Windows 11|Windows Server") {
    Write-Host "✓ OS supported" -ForegroundColor Green
} else {
    Write-Host "✗ OS not supported. Requires Windows 10 or newer." -ForegroundColor Red
}

# RAM
$ram = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
Write-Host ""
Write-Host "RAM: $ram GB"
if ($ram -ge 4) {
    Write-Host "✓ Sufficient RAM" -ForegroundColor Green
} elseif ($ram -ge 2) {
    Write-Host "⚠ Minimum RAM met, but 4GB+ recommended" -ForegroundColor Yellow
} else {
    Write-Host "✗ Insufficient RAM. Requires 4GB minimum." -ForegroundColor Red
}

# Disk Space
$disk = Get-PSDrive C
$free = [math]::Round($disk.Free / 1GB, 2)
Write-Host ""
Write-Host "Free Disk Space (C:): $free GB"
if ($free -ge 10) {
    Write-Host "✓ Sufficient disk space" -ForegroundColor Green
} else {
    Write-Host "✗ Insufficient disk space. Requires 10GB minimum." -ForegroundColor Red
}

# Check if XAMPP installed
Write-Host ""
if (Test-Path "C:\xampp\apache\bin\httpd.exe") {
    $apacheVersion = & "C:\xampp\apache\bin\httpd.exe" -v 2>&1 | Select-String "Apache"
    Write-Host "✓ XAMPP/Apache installed: $apacheVersion" -ForegroundColor Green
} else {
    Write-Host "✗ XAMPP not found at C:\xampp" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.apachefriends.org/" -ForegroundColor Yellow
}

# Network adapter
Write-Host ""
$adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}
Write-Host "Active Network Adapters:"
foreach ($adapter in $adapters) {
    Write-Host "  - $($adapter.Name): $($adapter.InterfaceDescription)"
}

Write-Host ""
Write-Host "=== Requirements Check Complete ===" -ForegroundColor Cyan
```

---

## Appendix B: Quick Start Checklist

### Windows Installation Checklist

- [ ] **Pre-Installation**
  - [ ] Verify Windows 10 or newer
  - [ ] At least 4GB RAM available
  - [ ] At least 10GB disk space
  - [ ] Administrator access

- [ ] **Install XAMPP**
  - [ ] Download XAMPP from apachefriends.org
  - [ ] Run installer (choose Apache, MySQL, PHP, phpMyAdmin)
  - [ ] Install to C:\xampp
  - [ ] Launch XAMPP Control Panel

- [ ] **Configure XAMPP**
  - [ ] Start Apache and MySQL
  - [ ] Install as Windows Services
  - [ ] Configure PHP (php.ini)
  - [ ] Configure Apache (httpd.conf)

- [ ] **Install piClinc**
  - [ ] Run installation PowerShell script
  - [ ] Copy application files
  - [ ] Deploy React frontend
  - [ ] Create directories (logs, images, backups)

- [ ] **Setup Database**
  - [ ] Create `piclinic` database
  - [ ] Import schema (piclinic.sql)
  - [ ] Create database user
  - [ ] Set password in config

- [ ] **Test Installation**
  - [ ] Access http://localhost/piclinic/
  - [ ] Verify login page loads
  - [ ] Test login (if test data imported)
  - [ ] Check React app loads

- [ ] **Network Setup** (for multi-PC)
  - [ ] Configure Windows Firewall
  - [ ] Set static IP or DHCP reservation
  - [ ] Configure Apache for network access
  - [ ] Test from another PC

- [ ] **Production Setup**
  - [ ] Change all default passwords
  - [ ] Configure backups
  - [ ] Schedule automated backups
  - [ ] Document configuration
  - [ ] Train staff

---

## Appendix C: Network Troubleshooting Commands

```powershell
# Check if services are running
Get-Service | Where-Object {$_.DisplayName -match "Apache|MySQL"}

# Check listening ports
netstat -ano | findstr "LISTENING"

# Check specific port
netstat -ano | findstr :80

# Test connectivity from client
Test-NetConnection -ComputerName 192.168.1.100 -Port 80

# Check firewall rules
Get-NetFirewallRule -DisplayName "*piClinc*" | Format-Table -AutoSize

# Disable firewall temporarily (TESTING ONLY)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Re-enable firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Check Apache error log
Get-Content C:\xampp\apache\logs\error.log -Tail 50

# Check MySQL error log
Get-Content C:\xampp\mysql\data\*.err -Tail 50

# Check PHP error log
Get-Content C:\xampp\php\logs\php_error.log -Tail 50
```

---

**Document Version:** 1.0
**Created:** 2026-03-15
**Author:** Claude Code
**Status:** Windows Deployment Guide for piClinc v2.0
