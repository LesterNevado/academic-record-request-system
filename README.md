# NEU Academic Record Request System (ARRS)

## Overview
URL: https://academic-record-request-system.lovable.app/

The New Era University Academic Record Request System (NEU ARRS) is a comprehensive web application designed to streamline the process of requesting, managing, and processing academic documents for students, faculty, and administrators. This system automates the traditionally manual process of requesting official academic records such as transcripts, certificates, and other essential documents.

## Key Features
### User Roles and Permissions
- **Student Portal:** Request academic documents, track request status, and receive notifications
- **Employee/Faculty Portal:** Process student requests, schedule document pickups, and manage academic record requests
- **Admin Portal:** User role management, system oversight, and access to detailed analytics
  
### Document Request Types
The system supports various academic document requests:
- Certificate of Grades (COG)
- Registration Form
- Certificate of Matriculation (COM)
- Certificate of Enrollment (COE)
- Certificate of No Availed Scholarship (COA)
- Statement of Account (SOA)
- Certifications with custom details
- Other document types with specifications
  
### Payment Integration
- Secure payment processing via Stripe
- Support for different document pricing based on type
- Additional fees for CTC/Dry Seal services
- Automatic payment confirmation and receipt generation

### Request Processing Workflow
1. Student submits document request with required details
2. Payment processing through secure Stripe checkout
3. Request enters "Awaiting Pickup" status after successful payment
4. Faculty/Employees review and process requests
5. Document pickup date is scheduled and notes added
6. Automated email notifications sent to students
7. Request status updated to "Approved" with pickup details

### Activity Tracking & Logs
- Comprehensive activity logging for faculty/employee actions
- Detailed logs for login, sign out, and document processing activities
- Searchable and filterable activity history
- Related user tracking for supervisory oversight

### Responsive Design
- Mobile-friendly interface optimized for all devices
- Intuitive dashboard for each user role
- Clean, modern UI built with Tailwind CSS and shadcn-ui components

## Technology Stack
- Frontend: React, TypeScript, Tailwind CSS, shadcn-ui
- State Management: React Context API, TanStack Query
- Backend: Supabase (Database, Authentication, Storage)
- Payments: Stripe Integration
- Email Notifications: Custom email service via Supabase Edge Functions
- Authentication: Google OAuth through Supabase Auth
- Deployment: Lovable

## System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Institutional email address for authentication (@neu.edu.ph)

## Installation & Setup
For developers who want to extend or modify the system:

```
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd neu-academic-records-system

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage
### Student Flow
1. Login with institutional email
2. Navigate to "New Request" in the dashboard
3. Fill in required document details and student information
4. Select document type(s) and specify quantity
5. Complete payment through Stripe
6. Monitor request status in "My Requests" page
7. Receive email notification when documents are ready for pickup

### Employee/Faculty Flow
1. Login with institutional email
2. Access the Employee Portal dashboard
3. View pending requests in the "Yet to be Approved" tab
4. Review request details and process accordingly
5. Schedule pickup dates and add processing notes
6. Approve requests, triggering email notification to students
7. Track activities in the logs section

### Admin Flow
1. Login with administrative credentials
2. Access the Admin Portal
3. Manage user roles and permissions
4. View system-wide request statistics
5. Monitor employee activities through comprehensive logs

## Security Features
- Role-based access control
- Institutional email authentication
- Secure payment processing
- Activity logging for audit trails

## Support
For support inquiries, please contact the NEU-CICS department or system administrators through the institutional email.

## License
© New Era University. All rights reserved.
