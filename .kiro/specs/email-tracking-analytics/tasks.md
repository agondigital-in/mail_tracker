# Implementation Plan

- [x] 1. Set up database models and schemas



  - Create Mongoose models for Email, OpenEvent, ClickEvent, BounceEvent, and Campaign
  - Define schemas with proper field types, validations, and indexes
  - Export models for use in services
  - _Requirements: 1.3, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Implement email service layer

  - [x] 2.1 Create email sending service


    - Implement `sendEmail` function with SMTP integration using nodemailer
    - Implement `generateTrackingId` function to create unique identifiers
    - Implement `processHtmlContent` function to inject tracking pixel and convert URLs to tracked links
    - Store email records in database with tracking ID and metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  
  - [ ] 2.2 Create email retrieval service
    - Implement `getEmailById` function with user authorization check

    - Implement `listEmails` function with pagination and campaign filtering


    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 3. Implement tracking service layer
  - [ ] 3.1 Create open tracking service
    - Implement `logOpenEvent` function to record opens with IP, user agent, and timestamp

    - Implement `isGmailProxy` function to detect Gmail image proxy
    - Implement `updateEmailFirstOpen` function to set first open timestamp
    - Calculate and update unique/total open counts
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  


  - [ ] 3.2 Create click tracking service
    - Implement `logClickEvent` function to record clicks with metadata
    - Implement `updateEmailFirstClick` function to set first click timestamp
    - Calculate and update unique/total click counts
    - Create implicit open event when click occurs without prior open


    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 4. Implement bounce handling service
  - Implement `logBounceEvent` function to record bounce events
  - Implement `categorizeBounce` function to determine hard/soft bounce type


  - Implement `flagEmailAddress` function to mark problematic addresses
  - Update email records with bounce status and reason
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Implement campaign service layer
  - Implement `createCampaign` function to create campaigns with user association

  - Implement `getCampaignById` function with user authorization check


  - Implement `listCampaigns` function to retrieve user's campaigns
  - Implement `getCampaignStats` function to calculate aggregated metrics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Implement analytics service layer
  - Implement `getDashboardStats` function to calculate overall user metrics
  - Implement `getEmailStats` function for email-level analytics


  - Implement `getCampaignStats` function for campaign-level analytics
  - Implement `getTimeline` function to get opens/clicks over time
  - Implement calculation functions for open rate, click rate, CTR, and bounce rate
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Create tracking API endpoints

  - [x] 7.1 Create open tracking endpoint


    - Implement `/api/track/open` GET route
    - Extract tracking ID from query parameters
    - Extract IP address and user agent from request headers
    - Call tracking service asynchronously to log event
    - Return 1×1 transparent GIF with appropriate headers
    - Handle errors gracefully without breaking email experience


    - _Requirements: 2.1, 2.2, 10.1, 10.3, 10.4, 10.5_
  
  - [ ] 7.2 Create click tracking endpoint
    - Implement `/api/track/click` GET route
    - Extract tracking ID and destination URL from query parameters


    - Extract IP address and user agent from request headers
    - Call tracking service asynchronously to log event
    - Redirect user to original destination URL
    - Handle errors gracefully without breaking user experience

    - _Requirements: 3.1, 3.2, 10.2, 10.3, 10.5_



- [ ] 8. Create email management API endpoints
  - [ ] 8.1 Create email sending endpoint
    - Implement `/api/emails/send` POST route with authentication
    - Validate input fields (to, subject, html, optional campaignId)


    - Call email service to process and send email
    - Return success response with tracking ID
    - Handle SMTP errors with appropriate error messages
    - _Requirements: 1.1, 1.2, 1.3, 8.2, 8.4, 8.5_


  
  - [ ] 8.2 Create email list endpoint
    - Implement `/api/emails/list` GET route with authentication
    - Support pagination with page and limit query parameters


    - Support filtering by campaignId
    - Return emails with basic metadata
    - _Requirements: 7.2, 7.4_
  
  - [ ] 8.3 Create email detail endpoint
    - Implement `/api/emails/[id]` GET route with authentication


    - Retrieve email with all associated events (opens, clicks, bounce)
    - Verify user authorization before returning data
    - Return comprehensive email data with events
    - _Requirements: 7.2, 7.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Create campaign API endpoints


  - [x] 9.1 Create campaign creation endpoint





    - Implement `/api/campaigns/create` POST route with authentication
    - Validate input fields (name, optional description)


    - Associate campaign with authenticated user
    - Return success response with campaign ID
    - _Requirements: 5.1, 7.3, 8.3_
  
  - [x] 9.2 Create campaign list endpoint

    - Implement `/api/campaigns/list` GET route with authentication


    - Retrieve all campaigns for authenticated user
    - Return campaigns with basic metadata
    - _Requirements: 5.3, 7.2, 7.4_
  


  - [ ] 9.3 Create campaign detail endpoint
    - Implement `/api/campaigns/[id]` GET route with authentication
    - Retrieve campaign with aggregated statistics
    - Retrieve all emails associated with campaign


    - Verify user authorization before returning data
    - _Requirements: 5.3, 5.4, 7.2, 7.4_

- [ ] 10. Create analytics API endpoint
  - Implement `/api/analytics/dashboard` GET route with authentication
  - Calculate total sent, opens, clicks, bounces for user

  - Calculate open rate, click rate, CTR, bounce rate


  - Generate timeline data for opens and clicks over time
  - Return comprehensive dashboard analytics
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.2, 7.4_



- [ ] 11. Create bounce webhook endpoint
  - Implement `/api/webhooks/bounce` POST route
  - Validate webhook signature from SMTP provider
  - Extract bounce data from request body
  - Call bounce service to log event and update email record


  - Return 200 OK response
  - _Requirements: 4.1, 4.2_

- [ ] 12. Build email composer UI
  - [x] 12.1 Create email composer form component

    - Build form with shadcn Input components for recipient and subject


    - Add textarea or rich text editor for HTML content
    - Add campaign selector dropdown
    - Implement form validation
    - _Requirements: 8.1, 8.2, 8.3_
  


  - [ ] 12.2 Create email composer page
    - Create `/dashboard/compose` page component
    - Integrate email composer form



    - Handle form submission to `/api/emails/send`


    - Display success message with tracking ID
    - Redirect to email detail page on success
    - Handle and display errors using toast notifications
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Build dashboard analytics UI


  - [ ] 13.1 Create stats cards component
    - Build card components using shadcn Card
    - Display total sent, opens, clicks, bounces
    - Display calculated rates (open rate, click rate, CTR, bounce rate)
    - _Requirements: 6.1, 6.2_
  
  - [ ] 13.2 Create analytics chart component
    - Implement timeline chart for opens and clicks over time
    - Use a charting library (recharts or similar)
    - Display data from analytics API
    - _Requirements: 6.4_
  
  - [ ] 13.3 Create dashboard page
    - Create `/dashboard` page component
    - Integrate stats cards and analytics chart
    - Fetch data from `/api/analytics/dashboard`
    - Display recent emails list
    - Display campaigns list with metrics
    - Implement authentication check and redirect

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

- [ ] 14. Build email detail UI
  - [ ] 14.1 Create email metadata component
    - Display email recipient, subject, sent timestamp, campaign
    - Show email status (opened, clicked, bounced)


    - Display calculated metrics for the email
    - _Requirements: 9.1_
  
  - [ ] 14.2 Create events list components
    - Build table component for open events with timestamp, IP, user agent
    - Build table component for click events with timestamp, IP, user agent, URL
    - Highlight first unique open and click events
    - Display bounce information if applicable
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  



  - [ ] 14.3 Create email detail page
    - Create `/dashboard/emails/[id]` page component
    - Integrate email metadata and events list components
    - Fetch data from `/api/emails/[id]`


    - Implement authentication check and authorization
    - Handle not found and unauthorized errors
    - _Requirements: 7.1, 7.2, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15. Build campaign management UI
  - [ ] 15.1 Create campaign creation form
    - Build form with shadcn Input for name and description
    - Implement form validation
    - Handle submission to `/api/campaigns/create`
    - Display success message and redirect
    - _Requirements: 5.1, 8.3_
  
  - [ ] 15.2 Create campaign list component
    - Display campaigns in card or table format
    - Show campaign name, description, email count, metrics
    - Link to campaign detail page
    - _Requirements: 5.3_
  
  - [ ] 15.3 Create campaign detail page
    - Create `/dashboard/campaigns/[id]` page component
    - Display campaign metadata and aggregated statistics
    - Display list of emails in campaign with metrics
    - Display campaign timeline chart
    - Fetch data from `/api/campaigns/[id]`
    - Implement authentication check and authorization
    - _Requirements: 5.3, 5.4, 6.3, 7.1, 7.2_

- [ ] 16. Implement authentication guards
  - Create middleware or HOC to protect dashboard routes
  - Redirect unauthenticated users to login page
  - Verify user session using Better Auth
  - Apply to all dashboard pages and API routes
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 17. Add environment configuration
  - Document required environment variables in README
  - Add SMTP configuration variables (host, port, user, password, from)
  - Add webhook secret for bounce endpoint
  - Validate environment variables on application startup
  - _Requirements: 1.1_

- [ ] 18. Implement error handling and logging
  - Create consistent error response format for API routes
  - Implement error logging with context (user ID, request details)
  - Add user-friendly error messages in UI using toast notifications
  - Ensure tracking endpoints always return success to avoid breaking emails
  - _Requirements: 10.5_

- [ ]* 19. Add performance optimizations
  - Implement asynchronous event logging in tracking endpoints
  - Add database indexes on frequently queried fields
  - Set appropriate cache headers on tracking pixel
  - Implement pagination for list endpoints
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 20. Create seed data and development utilities
  - Create script to generate test emails and events
  - Add development utilities for testing tracking endpoints
  - Create sample campaigns with analytics data
  - _Requirements: All_
