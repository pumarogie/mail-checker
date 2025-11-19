# Email Validator API

A production-ready email validation service built with Next.js, featuring Stripe-like RESTful APIs for single and bulk email validation. Validate email addresses without sending emails by checking format, domain existence, and MX records.

## ✨ Features

- **Single Email Validation** - Validate individual email addresses with detailed results
- **Bulk Validation** - Process Excel/CSV files containing multiple emails
- **Stripe-like API** - Professional RESTful API with consistent response formats
- **DNS Validation** - Check domain existence and MX record availability  
- **File Processing** - Support for .xlsx, .xls, and .csv file formats
- **Rate Limiting** - Built-in protections against abuse
- **Caching** - DNS result caching for improved performance
- **TypeScript** - Fully typed codebase with comprehensive error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 20.16.0 or higher
- pnpm (recommended) or npm

### Installation

```bash
git clone <repository-url>
cd mail-checker
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Production Build

```bash
pnpm build
pnpm start
```

## 📚 API Reference

All API endpoints return JSON responses with consistent Stripe-like formatting.

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Currently no authentication required. API keys can be implemented for production use.

---

## 📧 Single Email Validation

### `POST /api/v1/emails/verify`

Validate a single email address.

**Request:**
```json
{
  "email": "user@example.com",
  "options": {
    "check_mx": true,
    "check_smtp": false
  }
}
```

**Response:**
```json
{
  "object": "email",
  "id": "email_1234567890abc",
  "created": 1640995200,
  "livemode": false,
  "email": "user@example.com",
  "valid": true,
  "deliverable": "deliverable",
  "domain": "example.com",
  "reason": "Email address is valid and deliverable",
  "checks": {
    "format": true,
    "domain": true,
    "mx_records": 2,
    "smtp": false
  }
}
```

### `GET /api/v1/emails/verify?email=user@example.com`

Alternative GET endpoint for simple validation.

---

## 📁 Bulk Email Validation

### `POST /api/v1/emails/batch`

Upload and validate emails from Excel/CSV files.

**Request:**
```bash
curl -X POST \
  -F "file=@emails.xlsx" \
  http://localhost:3000/api/v1/emails/batch
```

**Response:**
```json
{
  "object": "batch_result",
  "id": "batch_1234567890abc",
  "created": 1640995200,
  "livemode": false,
  "total_count": 100,
  "valid_count": 85,
  "invalid_count": 15,
  "file_name": "emails.xlsx",
  "file_size": 12480,
  "processed_at": 1640995210,
  "results": [
    {
      "object": "email",
      "email": "user1@example.com",
      "valid": true,
      "deliverable": "deliverable",
      "domain": "example.com",
      "reason": "Email address is valid and deliverable",
      "checks": {
        "format": true,
        "domain": true,
        "mx_records": 2
      }
    }
  ],
  "metadata": {
    "file_type": "xlsx",
    "processing_time_ms": 2500,
    "truncated": false
  }
}
```

### `GET /api/v1/emails/batch`

Get information about batch processing limits and supported formats.

**Response:**
```json
{
  "object": "batch_info",
  "supported_formats": ["xlsx", "xls", "csv"],
  "limits": {
    "max_file_size_mb": 10,
    "max_emails_per_batch": 100
  },
  "mime_types": {
    "xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    "xls": ["application/vnd.ms-excel"],
    "csv": ["text/csv", "application/csv"]
  }
}
```

---

## ❌ Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "object": "error",
    "type": "validation_error",
    "code": "invalid_email_format",
    "message": "Invalid email format",
    "param": "email"
  }
}
```

### Error Types
- `api_error` - Server errors
- `invalid_request_error` - Client errors  
- `validation_error` - Input validation failures
- `rate_limit_error` - Too many requests

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Server Error

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/v1/emails/         # API endpoints
│   │   ├── verify/           # Single email validation
│   │   └── batch/            # Bulk validation
│   ├── page.tsx              # Frontend interface
│   └── layout.tsx            # App layout
├── lib/
│   ├── services/             # Business logic
│   │   ├── email-validator.ts
│   │   └── file-processor.ts
│   ├── utils/                # Utilities
│   │   ├── errors.ts         # Error handling
│   │   └── response.ts       # Response formatting
│   └── constants/            # Configuration
└── types/                    # TypeScript definitions
    ├── api.ts                # API types
    └── email.ts              # Email validation types
```

## 🛠️ Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript checks

## 📝 Supported File Formats

### Excel Files
- `.xlsx` - Excel 2007+ format
- `.xls` - Legacy Excel format
- `.csv` - Comma-separated values

### File Requirements
- Maximum file size: 10MB
- Maximum emails per batch: 100 (free tier)
- Emails can be in any column or cell

## ⚡ Performance

- **DNS Caching** - 5-minute cache for DNS lookups
- **Batch Processing** - Concurrent validation with rate limiting
- **Memory Efficient** - Streaming file processing
- **Response Times** - ~50ms single email, ~2-5s for 100 emails

## 🔧 Configuration

### Environment Variables

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3000
ENABLE_RATE_LIMITING=true
ENABLE_SMTP_CHECK=false
LOG_LEVEL=info
```

### Rate Limiting
- 60 requests per minute per IP
- Burst limit of 10 requests
- Automatic backoff for DNS lookups

---

Built with ❤️ using Next.js, TypeScript, and modern web standards.# mail-checker
