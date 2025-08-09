# AssignmentHub

A streamlined file sharing and presentation system designed to eliminate the common classroom hassles of student presentations.

## 🎯 Problem Solved

One of the biggest time-wasters in classroom presentations is the technical setup:

1. **Server Navigation Issues**: Students upload files to IIIT-H servers, then waste time logging in, navigating folders, and finding files during presentations
2. **USB Drive Fumbling**: Students struggle with pen drives, compatibility issues, and file transfers
3. **Laptop Connection Problems**: Time lost connecting personal laptops to projector cables, driver issues, and display problems

**AssignmentHub eliminates all these problems** by providing a centralized, web-based platform where students can upload files beforehand and instructors can instantly access them during class.

## ✨ Key Features

### For Students
- **Simple File Upload**: Upload presentation files (PDF, PPTX, DOCX, images) with assignment categorization
- **Team-Based Organization**: Each team has secure login credentials
- **Assignment Grouping**: Files automatically organized by assignment for easy navigation
- **File Preview**: Preview files before presentations without downloading
- **Cross-Team Viewing**: View files from other teams when assignments are marked as "open view"

### For Instructors (Admin)
- **Instant Access**: View all student files organized by team and assignment
- **Live Presentation Mode**: Quick access to any student's files during class presentations
- **Visibility Control**: Toggle assignment visibility for peer reviews and collaborative sessions
- **File Management**: Upload instructor files, edit descriptions, and manage content
- **Bulk Operations**: Delete multiple files, manage assignments efficiently

### Technical Features
- **No Installation Required**: Pure web-based solution accessible from any browser
- **Responsive Design**: Works on laptops, tablets, and mobile devices
- **Secure Authentication**: Team-based login system with admin controls
- **File Type Support**: PDF, PPTX, DOCX, PNG, JPG, XLSX files up to 50MB
- **Database Persistence**: PostgreSQL backend ensures files persist across server restarts
- **Real-time Updates**: Changes reflect immediately across all users

## 🚀 Quick Start Guide

### For Students

1. **Get Your Credentials**: Ask Warrier for your team login credentials or password reset
2. **Login**: Use your team number and password to access the system
3. **Upload Files**: 
   - Click "Upload" tab
   - Select your assignment from the dropdown
   - Drag & drop or browse for files
   - Add labels and descriptions for easy identification
4. **Manage Files**: Use "Your Files" tab to view and organize your uploads
5. **View Others**: Check "Other Team Files" to see presentations from other teams (when allowed)

### For Instructors

1. **Admin Login**: Use admin credentials to access instructor features
2. **Student Files**: Access "Team Files" to view all student submissions organized by team/assignment
3. **Your Content**: Use "W.'s Files" to manage instructor-uploaded materials
4. **Assignment Control**: Toggle assignment visibility using the settings menu
5. **Live Presentations**: During class, instantly access any student's files for presentation

## 🔧 Installation & Deployment

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- PM2 for production deployment

### Environment Setup
1. Copy `AssignmentHub.env.example` to `AssignmentHub.env`
2. Configure your database connection and passwords:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/assignmenthub
ADMIN_PASSWORD=your-secure-admin-password
TEAM_1_PASSWORD=team1-password
# ... additional team passwords
```

### Deployment Commands
```bash
git clone https://github.com/raviwarrier/AssignmentHub.git
cd AssignmentHub
cp AssignmentHub.env.example AssignmentHub.env
# Edit AssignmentHub.env with your credentials
npm ci
npm run build
pm2 start server/index.ts --name assignmenthub
```

### Server Management
```bash
pm2 status                    # Check application status
pm2 logs assignmenthub        # View application logs  
pm2 restart assignmenthub     # Restart after updates
pm2 stop assignmenthub        # Stop application
```

## 📋 Supported File Types

- **Documents**: PDF, DOCX
- **Presentations**: PPTX  
- **Images**: PNG, JPG, JPEG
- **Spreadsheets**: XLSX
- **File Size Limit**: 50MB per file

## 🔐 Security Features

- **Team-Based Authentication**: Secure login system for each team
- **Admin Controls**: Separate admin access for instructor functions
- **File Visibility**: Granular control over which files students can view
- **Session Management**: Automatic logout and secure session handling
- **Input Validation**: File type restrictions and size limits

## 🎓 Educational Benefits

- **Zero Setup Time**: Students upload files beforehand, presentations start instantly
- **Peer Learning**: Optional cross-team file viewing for collaborative learning
- **Better Organization**: Files grouped by assignment and team for easy navigation
- **Reduced Stress**: No more technical difficulties during presentation time
- **Improved Focus**: More time for actual presentation content, less on technical setup

## 🛠️ Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local filesystem with database metadata
- **Authentication**: Session-based with secure cookies
- **Build**: Vite for development and production builds

## 📞 Support

For technical issues, password resets, or questions about the system:

**Contact Warrier** for:
- Team password requests
- Password resets  
- Technical support
- Feature requests

---

## 🤖 Development

This application was developed with assistance from [Claude Code](https://claude.ai/code).

**Version**: 1.0  
**Last Updated**: August 2025  
**License**: MIT