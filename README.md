# Supertray

> [!IMPORTANT]  
> Supertray is in early development and not ready for production use.

## The open-source document management system

Supertray is an open-source document management system (DMS) that aims to simplify the way you handle and organize your documents. With a user-friendly interface and a focus on extensibility, Supertray offers a seamless experience for users and developers alike. Supertray will only be self-hosted first, but a cloud-hosted SaaS is planned for the future.

## Technology

Supertray will be built with the following technologies:

- Backend
  - [Node.js](https://nodejs.org/en/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [trpc](https://trpc.io/)
  - [zod](https://github.com/colinhacks/zod)
  - [Knex](https://knexjs.org/)
  - [Postgres](https://www.postgresql.org/)
  - [Redis](https://redis.io/)
  - [@tweedegolf/storage-abstraction](https://github.com/tweedegolf/storage-abstraction)
- Web-App
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Radix UI](https://radix-ui.com/)
- Extensions
  - **Currently unknown**
  - (?) [remote-ui](https://github.com/Shopify/remote-ui) for app extensions

## API Concept

```js
import { createServer, createDocumentParser } from '@supertray/api';
import { createOcrTextExtraction, createDataExtraction } from '@supertray/ocr-supertray-ai';
import { createPdfArchiveGenerator, createThumbnailGenerator } from '@supertray/gotenberg';

const server = createServer({
  documentPipeline: createDocumentParser({
    pdfArchiveGenerator: createPdfArchiveGenerator({
      // maybe gotenberg?
    }),
    thumbnailGenerator: createThumbnailGenerator({
      // maybe gotenberg?
    }),
    ocrTextExtraction: createOcrTextExtraction({
      // ...
    }),
    dataExtraction: createDataExtraction({
      // ...
    }),
  }),
});

server.run();
```

## Roadmap

Supertray is currently in development. The following features are planned:

### MVP

- [x] Authentication Strategies (#1, #11)
  - [x] E-Mail OTP
  - [x] Refresh Tokens
- [ ] Spaces (Workspaces)
  - [x] Manage
  - [x] Manage Members
  - [ ] Manage Roles
- [ ] File Storage Adapter (configurable)
  - [x] Local Storage
  - [ ] S3 Storage
  - [ ] Thumbnail Generation for
    - [ ] PDF
    - [ ] Images
    - [ ] Text
    - [ ] Word
    - [ ] Excel
- [ ] Documents
  - [x] Upload
  - [ ] Initial Parsing Pipeline (OCR etc.)
  - [ ] Download
  - [ ] Archive
  - [ ] Delete (Trash)
  - [ ] Search
  - [ ] Revisions / Versioning
- [ ] Document Types
  - [ ] Manage
  - [ ] Manage Fields (JSON Schema?)
  - [ ] Manage Permissions (Roles)
  - [ ] Manage OCR Settings
- [ ] OCR Service
  - [ ] Extract Text
  - [ ] Extract Structured Data (use Document Type Fields Schema?)
  - [ ] Detect Type

### Other considerable features

- [ ] Authentication Strategies
  - [ ] SSO/OAuth
  - [ ] MFA
  - [ ] API Keys
- [ ] Documents
  - [ ] Read Logs
  - [ ] Comments
  - [ ] Tags
  - [ ] Custom Fields
  - [ ] Notes
- [ ] Trays
  - [ ] Manage
  - [ ] Move Documents
  - [ ] Manage User Permissions (Roles or Custom)
  - [ ] E-Mail Address to send emails with attachments to tray
- [ ] External Sharing
  - [ ] Trays
  - [ ] Documents
- [ ] Offline Support / Offline First
- [ ] Workflows
  - [ ] Document Assignees
  - [ ] Document Status
  - [ ] Document Approvals
  - [ ] Inbound / Outbound
- [ ] Folders (Virtual)
- [ ] Records (Virtual based on filters?), e.g. one record for every supplier dataset (with customizable directory structure)
- [ ] E-Signatures
- [ ] Integrations
  - [ ] Rest API
  - [ ] Webhooks
  - [ ] Datasets
    - Integrate External Data Sources (e.g. CRM, ERP) to connect data (etc. customers, suppliers) with documents
  - [ ] Document Import
    - [ ] E-Mail-Address
    - [ ] Filesystem
    - [ ] Scanner
    - [ ] Getmyinvoices
    - [ ] Other Drives (e.g. Google Drive, Dropbox, OneDrive, etc.)
  - [ ] Document Export
    - [ ] E-Mail
    - [ ] Filesystem
    - [ ] Datev (German accounting software)
- [ ] Extensions SDK
  - [ ] Custom Hooks
  - [ ] Custom File Storage Services
  - [ ] Custom Authentication Strategies
  - [ ] Custom Web-App Extensions
  - [ ] Custom Integrations
  - [ ] Custom Feathers Services
- [ ] Compliant with "GoBD" (German law for digital documents)
  - [ ] Versioning
  - [ ] Deletion Protocols
  - [ ] External Audit
- [ ] AI Integration
- [ ] Docker Support

## Ideas for Financing

Since other open source projects are showing that donations are not a reliable source of income, the following ideas are being considered to finance the project to make it sustainable:

- [ ] Paid Services
  - [ ] Paid Extensions
  - [ ] Paid On Premise Hosting
  - [ ] Paid Support / Development
- [ ] Paid Clients (Desktop, Mobile)
- [ ] Paid OCR Service
- [ ] Paid closed-source license
- [ ] Cloud-hosted SaaS
