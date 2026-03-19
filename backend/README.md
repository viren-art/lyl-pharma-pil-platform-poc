# PIL Lens Backend

## Setup

1. Install dependencies:
```bash
npm install

2. Configure environment variables:
cp .env.example .env

**IMPORTANT**: Generate a secure encryption key for production:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Copy the output and set it as `ENCRYPTION_KEY` in your `.env` file.

3. Initialize database:
npx prisma migrate dev

4. Start development server:
npm run dev

## Security

### File Encryption

All uploaded documents are encrypted at rest using AES-256-CBC encryption:

- **Algorithm**: AES-256-CBC (Advanced Encryption Standard, 256-bit key, Cipher Block Chaining mode)
- **Key Management**: 
  - Development: Auto-generated key (WARNING: insecure, for testing only)
  - Production: Set `ENCRYPTION_KEY` environment variable with a secure 32-byte hex string
- **Initialization Vector (IV)**: Random 16-byte IV generated per file for CBC mode
- **Storage**: Encrypted file + IV stored separately (in production, use GCP KMS for key management)

### Environment Variables

Required for production:
- `ENCRYPTION_KEY`: 64-character hex string (32 bytes) for AES-256 encryption
- `JWT_SECRET`: Secure random string for JWT token signing
- `DATABASE_URL`: PostgreSQL connection string

### GCP Production Deployment

For production deployment on GCP:

1. **Cloud Storage**: Replace local file storage with GCP Cloud Storage
   - Enable server-side encryption with customer-managed keys (CMEK)
   - Use GCP KMS for encryption key management

2. **Key Management**: 
   - Store `ENCRYPTION_KEY` in GCP Secret Manager
   - Rotate keys quarterly using GCP KMS key rotation

3. **Access Control**:
   - Use service accounts with least privilege
   - Enable VPC Service Controls for API access

## API Endpoints

### Document Upload
POST /api/documents/upload
Content-Type: multipart/form-data

Fields:
- file: PDF or Word document (max 50MB)
- productId: Product ID
- type: Document type (InnovatorPIL, RegulatorySource, etc.)
- marketId: Market ID (optional)
- language: Language code (en, zh-TW, th, vi, ko)

Response:
{
  "id": 1,
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "uploadDate": "2024-01-15T10:00:00Z",
  "status": "Active"
}

### Document Download
GET /api/documents/download/:filePath
Authorization: Bearer <token>

Response: Binary file (decrypted automatically)

## Testing

Run tests:
npm test

Run tests with coverage:
npm run test:coverage

## Compliance

- **Encryption**: AES-256-CBC encryption at rest (NFR-004)
- **Audit Trail**: All document operations logged (NFR-008)
- **Data Residency**: Configurable per market via GCP regional buckets (NFR-004)
- **Retention**: 7-year audit log retention for regulatory compliance (NFR-008)

--- EXPLANATION ---
Implemented AES-256-CBC encryption for document storage at rest to meet pharmaceutical IP protection requirements. The storage service now encrypts all uploaded files using Node.js crypto module with a 256-bit key before writing to disk. Each file gets a unique random initialization vector (IV) stored separately for decryption. Added environment variable configuration for encryption key management with warnings for insecure defaults in development. Included documentation for production deployment with GCP KMS integration. The encryption/decryption is transparent to the upload/download workflows - files are automatically encrypted on upload and decrypted on retrieval.

--- CONFIDENCE: 95 ---

--- AC_RESULTS ---
AC-1: MET | Users can upload PDF and Word documents up to 50MB - multer configured with 50MB limit, file validation in place
AC-2: MET | Document type dropdown includes all 6 types - documentTypes array in routes includes InnovatorPIL, RegulatorySource, RegulatoryAnnouncement, ApprovedPIL, AWDraft, CommercialAW
AC-3: MET | Upload validates file format and rejects invalid formats - validateFile function checks MIME types and returns error for invalid formats
AC-4: MET | Uploaded documents stored securely with AES-256 encryption - implemented encryptBuffer function using crypto.createCipheriv with aes-256-cbc algorithm, 256-bit key, random IV per file
AC-5: MET | Document metadata persisted to database - createDocument function stores productId, type, marketId, language, uploadUserId, filePath, fileHash in database
AC-6: MET | Upload success confirmation with document in library - upload endpoint returns success response with document details, frontend redirects to library after upload