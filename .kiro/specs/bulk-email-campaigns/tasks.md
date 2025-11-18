# Implementation Plan

- [x] 1. Set up Agenda job queue infrastructure



  - Install Agenda package (`npm install agenda`)
  - Create Agenda configuration file with MongoDB connection
  - Initialize Agenda instance with proper settings (concurrency, lock limits)
  - Implement graceful shutdown handler for Agenda
  - _Requirements: 8.1, 8.2, 14.1, 14.3_

- [x] 2. Create new database models


  - [x] 2.1 Create RecipientList model


    - Define Mongoose schema with userId, name, description, timestamps
    - Add indexes on userId for filtering
    - Export model for use in services
    - _Requirements: 1.1_


  
  - [ ] 2.2 Create Recipient model
    - Define Mongoose schema with recipientListId, email, name, customFields, unsubscribed
    - Add compound unique index on email + recipientListId
    - Add indexes on recipientListId and unsubscribed



    - Export model for use in services
    - _Requirements: 3.2_
  
  - [x] 2.3 Create MailServerConfig model


    - Define Mongoose schema with userId, name, host, port, user, password, from, status
    - Implement password encryption using crypto before saving
    - Add index on userId



    - Export model for use in services
    - _Requirements: 4.1_
  
  - [ ] 2.4 Extend Campaign model
    - Add type field with enum ['simple', 'bulk'] and default 'simple'

    - Add bulk-specific fields (recipientListIds, mailServers, schedule, delay, progress tracking)
    - Add agendaJobId field for job reference
    - Add indexes on type, userId+type, status, agendaJobId
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 3. Implement recipient list service layer
  - Create RecipientListService with createList, getListById, listUserLists, deleteList functions
  - Implement user authorization checks in all functions
  - Implement getListStats function to calculate total, active, unsubscribed counts
  - Handle cascade deletion of recipients when list is deleted
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement recipient service layer


  - [x] 4.1 Create basic recipient operations

    - Implement addRecipient function with email validation
    - Implement duplicate checking within list
    - Implement removeRecipient function with authorization
    - Implement getActiveRecipients function to filter unsubscribed
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.2 Implement file upload parsing


    - Implement parseCSV function using csv-parser or papaparse
    - Implement parseExcel function using xlsx or exceljs
    - Implement uploadRecipients function to process file and create recipients in batches
    - Handle invalid emails and duplicates, return summary
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 4.3 Implement unsubscribe functionality


    - Create signed token generation for unsubscribe links
    - Implement unsubscribeRecipient function with token validation
    - Update recipient unsubscribed status and timestamp
    - _Requirements: 15.2, 15.3_

- [ ] 5. Implement mail server service layer
  - Implement createServer function with SMTP configuration
  - Implement testConnection function using nodemailer to validate settings
  - Implement listUserServers and deleteServer functions with authorization
  - Implement createSMTPTransport function to create nodemailer transports
  - Handle password encryption/decryption
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement template service layer



  - Implement processVariables function to replace {{variable}} with recipient data
  - Handle missing variables by replacing with empty string
  - Implement getAvailableVariables function to extract custom fields from recipient lists
  - Implement validateTemplate function to check syntax



  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 7. Implement bulk campaign service layer
  - Implement createBulkCampaign function to create campaign and schedule Agenda job
  - Implement validateCampaignData function to check all inputs


  - Implement calculateEstimatedDuration function based on recipient count and delay


  - Implement pauseCampaign, resumeCampaign, cancelCampaign functions
  - Implement getCampaignProgress function for real-time status
  - _Requirements: 11.4, 12.1, 12.2, 12.4, 10.1, 10.2, 10.3, 10.4_

- [x] 8. Implement campaign job processor

  - [ ] 8.1 Create main job processing logic
    - Define Agenda job 'process-bulk-campaign'
    - Implement processCampaign function to orchestrate email sending
    - Load campaign and all recipients from selected lists
    - Filter out unsubscribed recipients

    - _Requirements: 8.1, 8.3, 15.3_
  
  - [ ] 8.2 Implement server distribution logic
    - Implement distributeToServers function to allocate recipients to mail servers based on limits
    - Handle round-robin distribution when limits not specified
    - Track sent count per server
    - _Requirements: 5.2, 5.3_

  
  - [ ] 8.3 Implement email sending with delay
    - Implement sendBatch function to send emails with specified delay
    - Process template variables for each recipient


    - Inject tracking pixel and convert URLs (reuse existing tracking logic)
    - Handle server failures and retry with next server
    - Update campaign progress after each send
    - _Requirements: 7.1, 7.2, 5.5, 8.4_
  
  - [x] 8.4 Implement progress tracking and error handling


    - Update campaign sentCount, failedCount, remainingCount in real-time



    - Log failed recipients with error messages
    - Check for pause status between sends
    - Mark campaign as completed or failed when done
    - _Requirements: 9.1, 9.3, 10.1, 10.2, 8.5_



- [ ] 9. Implement recurring campaign job processor
  - Define Agenda job 'process-recurring-campaign'

  - Implement logic to get next batch of recipients who haven't received email
  - Track lastExecutedAt and calculate next execution time
  - Schedule next job execution based on frequency
  - Handle end date to stop recurring campaigns
  - _Requirements: 6.3, 6.5_



- [x] 10. Create recipient list API endpoints


  - [ ] 10.1 Create recipient list management endpoints
    - Implement POST /api/recipient-lists/create with authentication
    - Implement GET /api/recipient-lists/list with authentication
    - Implement GET /api/recipient-lists/[id] with authentication and authorization
    - Implement DELETE /api/recipient-lists/[id] with authentication and authorization
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_


  
  - [ ] 10.2 Create recipient management endpoints
    - Implement POST /api/recipients/add with authentication
    - Implement POST /api/recipients/upload with file handling
    - Implement DELETE /api/recipients/[id] with authentication


    - Implement GET /api/recipients/unsubscribe (public with token validation)
    - _Requirements: 3.1, 3.5, 3.6, 2.1, 2.2, 15.1, 15.2, 15.4_




- [ ] 11. Create mail server API endpoints
  - Implement POST /api/mail-servers/create with authentication
  - Implement GET /api/mail-servers/list with authentication
  - Implement POST /api/mail-servers/test with authentication
  - Implement DELETE /api/mail-servers/[id] with authentication and check for active campaigns
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. Create bulk campaign API endpoints
  - [ ] 12.1 Create bulk campaign creation endpoint
    - Implement POST /api/campaigns/bulk/create with authentication
    - Validate all inputs (recipient lists, mail servers, schedule, delay)
    - Create campaign record with type='bulk'
    - Schedule Agenda job based on schedule type
    - Return campaign ID and estimated duration
    - _Requirements: 11.3, 6.1, 6.2, 6.3, 7.1, 12.4_
  
  - [ ] 12.2 Create campaign control endpoints
    - Implement POST /api/campaigns/[id]/pause with authentication
    - Implement POST /api/campaigns/[id]/resume with authentication
    - Implement POST /api/campaigns/[id]/cancel with authentication
    - Update Agenda job status accordingly
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 12.3 Create campaign monitoring endpoint
    - Implement GET /api/campaigns/[id]/progress with authentication
    - Return real-time status, sent, remaining, failed counts
    - Return sending rate and failed recipients list
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 13. Build recipient list management UI
  - [ ] 13.1 Create recipient list page
    - Create /dashboard/recipient-lists page component
    - Build RecipientListTable component with shadcn Table
    - Add CreateListButton with dialog form
    - Add list actions menu (edit, delete, view)
    - Fetch data from /api/recipient-lists/list
    - _Requirements: 1.2, 1.4_
  
  - [ ] 13.2 Create recipient list detail page
    - Create /dashboard/recipient-lists/[id] page component
    - Build RecipientTable component showing email, name, unsubscribe status
    - Add AddRecipientForm with validation
    - Add UploadRecipientsButton with file input
    - Add RemoveRecipientButton for each recipient
    - Display list stats (total, active, unsubscribed)
    - _Requirements: 1.5, 3.1, 3.5, 3.6, 2.1, 15.5_

- [ ] 14. Build mail server configuration UI
  - Create /dashboard/mail-servers page component
  - Build MailServerTable component with shadcn Table
  - Create AddServerForm with SMTP fields
  - Add TestConnectionButton to validate settings
  - Display server status badges (active, inactive, error)
  - Handle delete with confirmation dialog
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 15. Build bulk compose UI
  - [ ] 15.1 Create bulk compose form
    - Create /dashboard/compose/bulk page component
    - Build form with subject and HTML content editor
    - Add RecipientListSelector multi-select dropdown
    - Add MailServerSelector with limit input for each server
    - Add schedule options (immediate, scheduled, recurring)
    - Add delay input field
    - Display template variable helper showing available fields
    - _Requirements: 11.3, 1.6, 5.1, 6.1, 6.2, 6.3, 7.1, 13.4_
  
  - [ ] 15.2 Create campaign preview component
    - Build CampaignPreview component showing all settings
    - Display recipient count from selected lists
    - Show estimated send duration
    - Display sample email with template variables replaced
    - Add confirm and cancel buttons
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 16. Build campaign monitoring UI
  - Create /dashboard/campaigns/[id]/monitor page component
  - Build ProgressBar component showing visual progress
  - Display CampaignStats (sent, remaining, failed, rate)
  - Build FailedRecipientsList table
  - Add PauseResumeButtons with state management
  - Add CancelButton with confirmation
  - Implement polling to fetch progress every 5 seconds
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4_

- [ ] 17. Update existing campaign list UI
  - Add type filter to campaign list (simple, bulk, all)
  - Display campaign type badge for each campaign
  - Add link to monitoring page for bulk campaigns
  - Show status badge (scheduled, processing, completed, etc.)
  - _Requirements: 11.4, 17.1, 17.3_

- [ ] 18. Implement unsubscribe page
  - Create /unsubscribe page component (public route)
  - Display confirmation message after unsubscribe
  - Handle invalid token errors gracefully
  - Style with shadcn components
  - _Requirements: 15.4_

- [ ] 19. Add email footer with unsubscribe link
  - Update email sending logic to append unsubscribe link to all bulk campaign emails
  - Generate signed token for each recipient
  - Include unsubscribe URL in email footer
  - _Requirements: 15.1_

- [ ] 20. Implement authentication guards
  - Ensure all new API routes check authentication
  - Verify user ownership for all resource access
  - Apply to all dashboard pages
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 21. Add environment configuration
  - Document new environment variables in README
  - Add AGENDA_COLLECTION, MAX_CAMPAIGN_SIZE, MAX_FILE_SIZE_MB
  - Add UNSUBSCRIBE_SECRET for token signing
  - Add ENCRYPTION_KEY for mail server password encryption
  - Validate required variables on startup
  - _Requirements: 4.1, 8.1_

- [ ] 22. Implement error handling and logging
  - Add error handling for file upload failures
  - Handle SMTP connection errors gracefully
  - Log campaign job errors with context
  - Display user-friendly error messages in UI
  - Implement retry logic for failed sends
  - _Requirements: 5.4, 5.5, 5.6, 8.5, 14.2_

- [ ]* 23. Add data migration script
  - Create script to add type='simple' to existing campaigns
  - Ensure backward compatibility with existing data
  - _Requirements: 11.1, 11.2_

- [ ] 24. Add performance optimizations
  - Implement batch recipient queries (1000 at a time)
  - Add caching for mail server configs
  - Implement virtual scrolling for large recipient lists
  - Use connection pooling for SMTP
  - Stream file parsing for large uploads
  - _Requirements: 2.1, 2.2_

- [ ]* 25. Create seed data for development
  - Create script to generate test recipient lists
  - Generate sample mail server configurations
  - Create sample bulk campaigns with various schedules
  - _Requirements: All_
