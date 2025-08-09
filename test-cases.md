# AssignmentHub Test Cases

This document outlines comprehensive test cases to verify all functionality works correctly after recent updates.

## Admin Authentication Tests

### A1. Admin Login
- [ ] Navigate to the application
- [ ] Click admin login
- [ ] Enter correct admin password
- [ ] Verify successful login with "Admin" label in header
- [ ] Verify admin-specific navigation tabs are visible

### A2. Invalid Admin Login  
- [ ] Try logging in with incorrect admin password
- [ ] Verify error message displays
- [ ] Verify no access to admin features

## Student Authentication Tests

### S1. Student Login
- [ ] Navigate to the application 
- [ ] Enter team number (1-9) and corresponding password
- [ ] Verify successful login with "Team X" label in header
- [ ] Verify student-specific navigation tabs are visible

### S2. Invalid Student Login
- [ ] Try logging in with invalid team/password combination
- [ ] Verify error message displays
- [ ] Verify no access to application features

## Admin File Management Tests

### A3. Admin File Upload
- [ ] Login as admin
- [ ] Navigate to "Upload" section
- [ ] Upload files (PDF, PNG, JPG, DOCX, PPTX)
- [ ] Verify files are assigned to Team 0 (Warrier)
- [ ] Verify visibility toggle is available (checked by default)
- [ ] Test both visible and hidden file uploads
- [ ] Verify files appear in "W.'s Files" section

### A4. Admin File Editing
- [ ] Login as admin
- [ ] Navigate to "W.'s Files"
- [ ] Click "Edit" on any uploaded file
- [ ] **Test Cancel Button**: Click cancel, verify modal closes without saving
- [ ] Click "Edit" again
- [ ] **Test Save Changes**: Modify label, description, tags, click save
- [ ] **Verify Modal Closes**: Confirm modal closes after save
- [ ] **Verify Changes Persist**: Refresh page, verify changes saved
- [ ] Test editing files with special characters and empty fields

### A5. Admin File Visibility Control
- [ ] Login as admin
- [ ] Navigate to "W.'s Files"
- [ ] Toggle visibility on uploaded files (Hide/Show buttons)
- [ ] Verify badge changes from "Visible" to "Hidden"
- [ ] Test both making files visible and hidden

### A6. Admin File Deletion
- [ ] Login as admin
- [ ] Navigate to "W.'s Files"
- [ ] Click "Delete" on any file
- [ ] Enter correct admin password
- [ ] Verify file is deleted successfully
- [ ] Try delete with wrong password, verify it fails

## Admin Team File Management Tests

### A7. Admin Team Files View
- [ ] Login as admin
- [ ] Navigate to "Team Files"
- [ ] Test view mode toggles (Teams/Assignments)
- [ ] **Team View**: Select different teams from dropdown
- [ ] Verify "Warrier" appears instead of "Team 0" in dropdown
- [ ] **Assignment View**: Select different assignments
- [ ] Verify files display correctly in both views

### A8. Admin Assignment Settings
- [ ] Login as admin
- [ ] Click settings icon (gear icon)
- [ ] Toggle "Open View" for different assignments
- [ ] Verify changes save and reflect in file visibility

## Student File Management Tests

### S3. Student File Upload
- [ ] Login as student (Team 1-9)
- [ ] Navigate to "Upload" section  
- [ ] Upload various file types
- [ ] Verify files are assigned to correct team number
- [ ] Verify no visibility toggle (always visible to own team)

### S4. Student "Your Files" View (Simplified)
- [ ] Login as student
- [ ] Navigate to "Your Files" (renamed from "Team Files")
- [ ] **Verify Simplified Interface**: No dropdowns or toggles
- [ ] **Verify Assignment Grouping**: Files grouped directly by assignment
- [ ] Verify clean header with just title and upload button
- [ ] Click on files to preview
- [ ] Download files and verify success

### S5. Student "Other Team Files" View
- [ ] Login as student
- [ ] Navigate to "Other Team Files"
- [ ] **Test Admin File Visibility**: 
  - Should see admin files marked as "visible"
  - Should NOT see admin files marked as "hidden"
- [ ] **Test Team Label**: Admin files should show "Warrier" badge (not "Team 0")
- [ ] **Test Assignment Visibility**: 
  - Should see files from other teams ONLY if assignment is "Open View"
  - Should NOT see files from assignments not marked "Open View"
- [ ] Preview and download files from other teams
- [ ] Verify access permissions work correctly

## Cross-User Integration Tests

### I1. Admin-to-Student File Sharing
- [ ] **Admin**: Upload file, mark as "visible"
- [ ] **Student**: Login, check "Other Team Files"
- [ ] **Verify**: Student can see admin file labeled as "Warrier"
- [ ] **Admin**: Change file to "hidden"
- [ ] **Student**: Refresh, verify file disappears from "Other Team Files"

### I2. Assignment Open View Testing
- [ ] **Admin**: Upload files to Assignment 1, mark as hidden
- [ ] **Admin**: Set Assignment 1 as "Open View" 
- [ ] **Student**: Upload files to Assignment 1
- [ ] **Other Student**: Login as different team, check "Other Team Files"
- [ ] **Verify**: Should see other student files (assignment is open) but NOT admin files (marked hidden)

### I3. File Editing Persistence Across Users
- [ ] **Admin**: Upload file with basic info
- [ ] **Admin**: Edit file - add description, tags, change label
- [ ] **Admin**: Logout and login again
- [ ] **Admin**: Verify edits persisted in "W.'s Files"
- [ ] **Student**: Login, check "Other Team Files" 
- [ ] **Student**: Verify edited information displays correctly

## Error Handling & Edge Cases

### E1. File Upload Limits
- [ ] Try uploading files > 50MB (should fail)
- [ ] Try uploading unsupported file types (.txt, .exe, etc.)
- [ ] Upload 10+ files at once
- [ ] Test with files containing special characters in names

### E2. Session Management
- [ ] Login as admin, wait for session timeout, try to perform actions
- [ ] Login as student, manually clear cookies, try to access files
- [ ] Test concurrent logins with different users

### E3. Network Error Handling  
- [ ] Disconnect internet during file upload
- [ ] Refresh page during file operations
- [ ] Test with slow network connections

## User Interface Tests

### U1. Responsive Design
- [ ] Test on mobile devices (phone/tablet)
- [ ] Test on desktop at different screen sizes
- [ ] Verify all modals and dropdowns work on touch devices

### U2. Theme & Accessibility
- [ ] Toggle dark/light theme
- [ ] Test with keyboard navigation only
- [ ] Verify screen reader compatibility (basic test)

### U3. Navigation Flow
- [ ] Test all navigation tabs (Upload, Your Files/Team Files, Other Team Files, W.'s Files)
- [ ] Verify proper URLs and browser back button functionality
- [ ] Test logout functionality from all pages

## Data Persistence Tests (Production Only)

### P1. Server Restart Persistence
- [ ] Upload files as admin and students
- [ ] Restart the server
- [ ] Verify all files and metadata persist
- [ ] Verify assignment settings persist

### P2. Database Backup/Recovery
- [ ] Test with actual PostgreSQL database (not memory storage)
- [ ] Verify file metadata is stored correctly
- [ ] Test database connection failures gracefully fall back to memory

## Performance Tests

### PR1. File Operations
- [ ] Upload multiple large files simultaneously
- [ ] Test file preview performance with large PDF files
- [ ] Test download speeds with multiple concurrent users

### PR2. UI Performance  
- [ ] Test with 50+ files uploaded across multiple teams
- [ ] Verify file gallery loads quickly
- [ ] Test search and filtering performance

---

## Test Completion Checklist

**Required for Basic Functionality:**
- [ ] Admin login and file management (A1, A3, A4, A5)
- [ ] Student login and simplified view (S1, S4) 
- [ ] Admin file visibility to students (S5, I1)
- [ ] File editing modal fixes (A4 - cancel, save, persistence)
- [ ] "Warrier" labeling instead of "Team 0" (A7, S5)

**Required for Full Feature Set:**
- [ ] Assignment open view controls (A8, I2)
- [ ] Cross-user integration (I1, I2, I3)
- [ ] Error handling (E1, E2)
- [ ] Navigation and UI (U1, U2, U3)

**Production Ready:**
- [ ] All test cases above
- [ ] Performance tests (PR1, PR2)
- [ ] Data persistence (P1, P2)

---

*Last Updated: August 9, 2025*
*Test Environment: Development (Memory Storage)*
*Production Environment: PostgreSQL Database*