# Supertray

## The open-source document management system 
Supertray is an open-source document management system (DMS) that aims to simplify the way you handle and organize your documents. With a user-friendly interface and a focus on extensibility, Supertray offers a seamless experience for users and developers alike. Supertray will only be self-hosted first, but a cloud-hosted SaaS is planned for the future.

## Technology
Supertray will be built with the following technologies:
- Backend
  - [Node.js](https://nodejs.org/en/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Feathers](https://feathersjs.com/)
  - [Koa](https://koajs.com/)
  - [Socket.io](https://socket.io/)
  - [Knex](https://knexjs.org/)
  - [Postgres](https://www.postgresql.org/)
  - [Redis](https://redis.io/)
- Web-App
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [TailwindCSS](https://tailwindcss.com/)
  - [Radix UI](https://radix-ui.com/)
  - [Shadcn UI](https://ui.shadcn.com/)
- Extensions
  - **Currently unknown**
  - (?) [remote-ui](https://github.com/Shopify/remote-ui) for app extensions

## Roadmap
Supertray is currently in development. The following features are planned:

### MVP
- [ ] Authentication Strategies
  - [ ] E-Mail+Password
  - [ ] Refresh Tokens
- [ ] Spaces (Workspaces)
  - [ ] Manage
  - [ ] Manage Members
  - [ ] Manage Roles
- [ ] File Storage Service (configurable)
  - [ ] Local Storage
  - [ ] S3 Storage
  - [ ] Thumbnail Generation for
    - [ ] PDF
    - [ ] Images
    - [ ] Text
    - [ ] Word
    - [ ] Excel
- [ ] Documents
  - [ ] Upload
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
- [ ] Trays
  - [ ] Manage
  - [ ] Move Documents
  - [ ] Manage User Permissions (Roles or Custom)
- [ ] OCR Service
  - [ ] Extract Text
  - [ ] Extract Structured Data (use Document Type Fields Schema?)
  - [ ] Detect Type

### Other considerable features
- [ ] Authentication Strategies
  - [ ] OTP
  - [ ] SSO/OAuth
  - [ ] MFA
- [ ] Documents
  - [ ] Read Logs
  - [ ] Comments
  - [ ] Tags
  - [ ] Custom Fields
  - [ ] Notes
- [ ] Trays
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