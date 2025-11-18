# Requirements Document

## Introduction

This document defines the requirements for an advanced bulk email campaign system that extends the existing email tracking capabilities. The system will enable users to upload recipient lists from spreadsheet files, configure multiple SMTP mail servers, schedule campaigns with various timing options (one-time, recurring), set email delays, and process campaigns in the background using Agenda job queue. This builds upon the existing email tracking and analytics foundation to provide enterprise-grade bulk email capabilities.

## Glossary

- **Bulk Email Campaign System**: The application that manages large-scale email sending with recipient lists and scheduling
- **Recipient List**: A collection of email recipients imported from a file or created manually, stored as a separate database model
- **Recipient**: An individual email address with associated metadata (name, custom fields) that belongs to a specific recipient list via recipientListId reference
- **Simple Campaign**: A single-recipient email campaign (existing compose functionality) with type "simple"
- **Bulk Campaign**: A multi-recipient email campaign with recipient lists and advanced scheduling, with type "bulk"
- **Mail Server Configuration**: SMTP server credentials and settings stored for sending emails
- **Campaign Schedule**: The timing configuration for when emails should be sent (immediate, scheduled, recurring)
- **Email Delay**: The time interval between sending individual emails in a campaign
- **Background Job**: An asynchronous task processed by Agenda that handles campaign execution
- **Agenda**: A Node.js job scheduling library that processes campaigns in the background
- **One-Time Campaign**: A campaign that executes once at a specified time
- **Recurring Campaign**: A campaign that repeats at defined intervals (daily, weekly, monthly)
- **Campaign Job**: A background task that processes email sending for a campaign
- **Throttling**: Rate limiting email sends to avoid overwhelming mail servers
- **Recipient Upload**: The process of importing recipients from CSV or Excel files

## Requirements

### Requirement 1

**User Story:** As a user, I want to create and manage recipient lists, so that I can organize my email recipients for different campaigns

#### Acceptance Criteria

1. WHEN a user creates a recipient list, THE Bulk Email Campaign System SHALL store the list as a RecipientList model with a unique identifier, name, description, userId, and creation timestamp
2. WHEN a user views recipient lists, THE Bulk Email Campaign System SHALL display all lists with recipient count and metadata
3. WHEN a user deletes a recipient list, THE Bulk Email Campaign System SHALL remove the list and all associated recipients that reference the list ID
4. WHEN a user updates a recipient list, THE Bulk Email Campaign System SHALL allow modification of name and description
5. WHEN a user views a recipient list, THE Bulk Email Campaign System SHALL display all recipients with their email addresses, custom fields, and unsubscribe status
6. WHEN a user creates a bulk campaign, THE Bulk Email Campaign System SHALL allow selection of one or more existing recipient lists from the database by their IDs

### Requirement 2

**User Story:** As a user, I want to upload recipients from spreadsheet files, so that I can quickly import large lists of email addresses

#### Acceptance Criteria

1. WHEN a user uploads a CSV file, THE Bulk Email Campaign System SHALL parse the file and extract email addresses and custom fields
2. WHEN a user uploads an Excel file, THE Bulk Email Campaign System SHALL parse the file and extract email addresses and custom fields from the first sheet
3. WHEN the uploaded file contains invalid email addresses, THE Bulk Email Campaign System SHALL skip invalid entries and report them to the user
4. WHEN the file is parsed successfully, THE Bulk Email Campaign System SHALL create recipient records associated with the selected recipient list
5. WHEN duplicate email addresses exist in the upload, THE Bulk Email Campaign System SHALL skip duplicates and report the count to the user

### Requirement 3

**User Story:** As a user, I want to manually add and remove individual recipients from a list, so that I can manage my contact lists over time

#### Acceptance Criteria

1. WHEN a user adds a recipient manually, THE Bulk Email Campaign System SHALL validate the email address format
2. WHEN a user adds a recipient, THE Bulk Email Campaign System SHALL create a Recipient model with recipientListId reference, email, custom fields (name, company, etc.), and set unsubscribe status to false by default
3. WHEN a user adds a duplicate email to a list, THE Bulk Email Campaign System SHALL reject the addition and display an error message
4. WHEN a recipient is added successfully, THE Bulk Email Campaign System SHALL increment the recipient list count
5. WHEN a user removes a recipient from a list, THE Bulk Email Campaign System SHALL delete the recipient record and update the list count
6. WHEN a user views a recipient list after creation, THE Bulk Email Campaign System SHALL allow adding new recipients or removing existing ones

### Requirement 4

**User Story:** As a user, I want to configure multiple SMTP mail servers, so that I can distribute email sending across different providers

#### Acceptance Criteria

1. WHEN a user adds a mail server configuration, THE Bulk Email Campaign System SHALL store the SMTP host, port, username, password, and from address
2. WHEN a user adds a mail server, THE Bulk Email Campaign System SHALL validate the configuration by attempting a test connection
3. WHEN a user views mail server configurations, THE Bulk Email Campaign System SHALL display all servers with status (active, inactive, error)
4. WHEN a user updates a mail server configuration, THE Bulk Email Campaign System SHALL re-validate the connection
5. WHEN a user deletes a mail server configuration, THE Bulk Email Campaign System SHALL prevent deletion if active campaigns are using it

### Requirement 5

**User Story:** As a user, I want to create advanced campaigns with multiple mail server selection, so that I can optimize deliverability and throughput

#### Acceptance Criteria

1. WHEN a user creates a campaign, THE Bulk Email Campaign System SHALL allow selection of one or multiple mail server configurations with individual send limits for each server
2. WHEN a user configures mail servers for a campaign, THE Bulk Email Campaign System SHALL allow specification of how many emails each server should send (e.g., SMTP1: 200 emails, SMTP2: 50 emails)
3. WHEN a campaign executes, THE Bulk Email Campaign System SHALL distribute emails to each mail server according to the specified limits
4. WHEN a mail server reaches its send limit, THE Bulk Email Campaign System SHALL stop using that server and continue with remaining servers
5. WHEN a mail server fails during sending, THE Bulk Email Campaign System SHALL automatically retry using the next available server within its limit
6. WHEN all selected mail servers reach their limits or fail, THE Bulk Email Campaign System SHALL pause the campaign and notify the user
7. WHEN a user views campaign details, THE Bulk Email Campaign System SHALL display which mail servers were used, their configured limits, and actual send counts

### Requirement 6

**User Story:** As a user, I want to schedule campaigns with various timing options, so that I can control when emails are sent

#### Acceptance Criteria

1. WHEN a user creates a campaign, THE Bulk Email Campaign System SHALL allow selection of immediate, scheduled, or recurring execution
2. WHEN a user selects scheduled execution, THE Bulk Email Campaign System SHALL allow specification of date and time for campaign start
3. WHEN a user selects recurring execution, THE Bulk Email Campaign System SHALL allow selection of frequency (daily, weekly, monthly), batch size per execution, and recurrence end date
4. WHEN a scheduled campaign time arrives, THE Bulk Email Campaign System SHALL automatically start the campaign execution
5. WHEN a recurring campaign executes, THE Bulk Email Campaign System SHALL send emails to the next batch of recipients who have not yet received the email, continuing from where the previous execution stopped

### Requirement 7

**User Story:** As a user, I want to set email delays between sends, so that I can control sending rate and avoid being flagged as spam

#### Acceptance Criteria

1. WHEN a user creates a campaign, THE Bulk Email Campaign System SHALL allow specification of delay in seconds between individual email sends
2. WHEN the delay is set, THE Bulk Email Campaign System SHALL wait the specified duration between sending each email
3. WHEN a user sets delay to zero, THE Bulk Email Campaign System SHALL send emails as fast as possible without artificial delays
4. WHEN a campaign is executing with delay, THE Bulk Email Campaign System SHALL display estimated completion time based on recipient count and delay
5. WHEN a user views campaign progress, THE Bulk Email Campaign System SHALL show current sending rate (emails per minute)

### Requirement 8

**User Story:** As a user, I want campaigns to process in the background, so that I can continue using the application while emails are being sent

#### Acceptance Criteria

1. WHEN a user starts a campaign, THE Bulk Email Campaign System SHALL create a background job using Agenda
2. WHEN a background job is created, THE Bulk Email Campaign System SHALL return immediately to the user without blocking
3. WHEN a campaign job is processing, THE Bulk Email Campaign System SHALL update campaign status in real-time (queued, processing, completed, failed)
4. WHEN a campaign job completes, THE Bulk Email Campaign System SHALL update the campaign with final statistics (sent, failed, bounced)
5. WHEN a campaign job fails, THE Bulk Email Campaign System SHALL log the error and mark the campaign as failed with error details

### Requirement 9

**User Story:** As a user, I want to monitor campaign progress in real-time, so that I can track sending status and identify issues

#### Acceptance Criteria

1. WHEN a campaign is executing, THE Bulk Email Campaign System SHALL display current progress (emails sent, remaining, failed)
2. WHEN a user views campaign details, THE Bulk Email Campaign System SHALL show real-time status updates without requiring page refresh
3. WHEN emails fail during campaign execution, THE Bulk Email Campaign System SHALL display failed recipient emails with error reasons
4. WHEN a campaign completes, THE Bulk Email Campaign System SHALL display final statistics and success rate
5. WHEN a user views active campaigns, THE Bulk Email Campaign System SHALL show all currently processing campaigns with progress bars

### Requirement 10

**User Story:** As a user, I want to pause and resume campaigns, so that I can control campaign execution if issues arise

#### Acceptance Criteria

1. WHEN a user pauses a campaign, THE Bulk Email Campaign System SHALL stop sending new emails but complete in-flight sends
2. WHEN a campaign is paused, THE Bulk Email Campaign System SHALL update the campaign status to paused and preserve current progress
3. WHEN a user resumes a paused campaign, THE Bulk Email Campaign System SHALL continue sending from where it stopped
4. WHEN a user cancels a campaign, THE Bulk Email Campaign System SHALL stop all sending and mark the campaign as cancelled
5. WHEN a campaign is paused or cancelled, THE Bulk Email Campaign System SHALL update the background job status accordingly

### Requirement 11

**User Story:** As a user, I want campaigns to have distinct types, so that simple and bulk campaigns can coexist without interfering with each other

#### Acceptance Criteria

1. WHEN a user creates a campaign, THE Bulk Email Campaign System SHALL set the campaign type field to either "simple" or "bulk"
2. WHEN a user uses the existing compose feature, THE Bulk Email Campaign System SHALL create a campaign with type "simple" for single-recipient emails
3. WHEN a user uses the bulk compose feature, THE Bulk Email Campaign System SHALL create a campaign with type "bulk" for multi-recipient emails with recipient lists
4. WHEN a user views campaigns, THE Bulk Email Campaign System SHALL display campaign type to distinguish between simple and bulk campaigns
5. WHEN the system processes campaigns, THE Bulk Email Campaign System SHALL use different logic for simple and bulk campaign types

### Requirement 12

**User Story:** As a user, I want to preview campaign details before sending, so that I can verify configuration and avoid mistakes

#### Acceptance Criteria

1. WHEN a user creates a bulk campaign, THE Bulk Email Campaign System SHALL display a preview showing recipient count, mail servers, schedule, and delay settings
2. WHEN a user views the preview, THE Bulk Email Campaign System SHALL show estimated send duration based on recipient count and delay
3. WHEN a user views the preview, THE Bulk Email Campaign System SHALL display the email template with sample recipient data
4. WHEN a user confirms the preview, THE Bulk Email Campaign System SHALL create the campaign and schedule the background job
5. WHEN a user cancels the preview, THE Bulk Email Campaign System SHALL discard the campaign configuration without saving

### Requirement 13

**User Story:** As a user, I want to use template variables in emails, so that I can personalize messages for each recipient

#### Acceptance Criteria

1. WHEN a user composes a bulk email, THE Bulk Email Campaign System SHALL support template variables using double curly braces (e.g., {{name}}, {{email}})
2. WHEN a bulk campaign processes an email, THE Bulk Email Campaign System SHALL replace template variables with recipient-specific data
3. WHEN a template variable has no corresponding recipient data, THE Bulk Email Campaign System SHALL replace it with an empty string
4. WHEN a user previews an email template, THE Bulk Email Campaign System SHALL show sample output with example recipient data
5. WHEN template processing fails, THE Bulk Email Campaign System SHALL log the error and send the email with unprocessed variables

### Requirement 14

**User Story:** As a system administrator, I want the background job system to be reliable and recoverable, so that campaigns continue even after application restarts

#### Acceptance Criteria

1. WHEN the application starts, THE Bulk Email Campaign System SHALL connect to Agenda and resume any interrupted bulk campaigns
2. WHEN a campaign job fails, THE Bulk Email Campaign System SHALL retry up to 3 times with exponential backoff
3. WHEN the application shuts down, THE Bulk Email Campaign System SHALL gracefully stop Agenda and save campaign progress
4. WHEN a job is stuck or stale, THE Bulk Email Campaign System SHALL detect and restart the job after 10 minutes
5. WHEN multiple application instances are running, THE Bulk Email Campaign System SHALL ensure only one instance processes each job

### Requirement 17

**User Story:** As a user, I want to view campaign history and analytics, so that I can analyze performance over time

#### Acceptance Criteria

1. WHEN a user views campaign history, THE Bulk Email Campaign System SHALL display all past campaigns with type, status, and statistics
2. WHEN a user views a completed bulk campaign, THE Bulk Email Campaign System SHALL show detailed analytics including open rate, click rate, and bounce rate
3. WHEN a user filters campaigns, THE Bulk Email Campaign System SHALL allow filtering by type (simple, bulk), status (completed, failed, cancelled), date range, and recipient list
4. WHEN a user exports campaign data, THE Bulk Email Campaign System SHALL generate a CSV file with all campaign details and statistics
5. WHEN a user views campaign trends, THE Bulk Email Campaign System SHALL display charts showing campaign performance over time

### Requirement 15

**User Story:** As a recipient, I want to unsubscribe from email campaigns, so that I can stop receiving unwanted emails

#### Acceptance Criteria

1. WHEN an email is sent to a recipient, THE Bulk Email Campaign System SHALL include an unsubscribe link in the email footer
2. WHEN a recipient clicks the unsubscribe link, THE Bulk Email Campaign System SHALL mark the recipient's unsubscribe status as true in the database
3. WHEN a campaign processes recipients, THE Bulk Email Campaign System SHALL skip all recipients with unsubscribe status set to true
4. WHEN a recipient unsubscribes, THE Bulk Email Campaign System SHALL display a confirmation message
5. WHEN a user views a recipient list, THE Bulk Email Campaign System SHALL display the unsubscribe status for each recipient

### Requirement 16

**User Story:** As a user, I want to manage campaign access and permissions, so that only authorized users can create and manage campaigns

#### Acceptance Criteria

1. WHEN a user creates a campaign, THE Bulk Email Campaign System SHALL associate the campaign with the authenticated user's identifier
2. WHEN a user views campaigns, THE Bulk Email Campaign System SHALL display only campaigns owned by that user
3. WHEN a user attempts to access another user's campaign, THE Bulk Email Campaign System SHALL deny access and return an authorization error
4. WHEN a user deletes a campaign, THE Bulk Email Campaign System SHALL verify ownership before allowing deletion
5. WHEN a user views recipient lists, THE Bulk Email Campaign System SHALL display only lists owned by that user
