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

## Team Authentication Tests (NEW - Database + Passport.js)

### T1. Team Registration
- [ ] Navigate to application, click "Register Team" 
- [ ] **Test Team Number Validation**: Try invalid numbers (0, 10, letters)
- [ ] **Test Required Fields**: Try submitting without team number/password
- [ ] **Test Password Strength**: Try weak passwords (no uppercase, <12 chars, etc.)
- [ ] **Register Valid Team**: Team number (1-9), optional team name, strong password
- [ ] **Verify Success Message**: Should show "Team X has been registered" 
- [ ] **Test Duplicate Registration**: Try registering same team number again (should fail)

### T2. Team Login (Team Number + Password)
- [ ] Navigate to application 
- [ ] **Login with Team Number Only**: Enter team number (1-9) and password
- [ ] **Verify Successful Login**: Should show "Team X" or "Team Name" in header
- [ ] **Test Optional Team Names**: Teams with names should display name, teams without should show number
- [ ] **Test Invalid Credentials**: Wrong team number or password (should fail)

### T3. Environment Variable Fallback (Migration Support)
- [ ] **Test Legacy Login**: If TEAM_X_PASSWORD environment variables exist, login should work
- [ ] **Test Hybrid System**: Registered teams use database, unregistered teams use environment
- [ ] **Verify Migration Path**: Environment teams can register to upgrade to database auth

### T4. Password Management
- [ ] **Login as Team**: Login with database-registered team
- [ ] **Change Password**: Navigate to profile/settings, change password
- [ ] **Test Password Validation**: Try weak new passwords (should fail)
- [ ] **Test Current Password**: Wrong current password should fail
- [ ] **Verify New Password Works**: Logout, login with new password

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

### I2. Admin File Visibility vs Assignment Settings (CRITICAL - Bug Fix)
- [ ] **Setup**: Register Team 1 and Team 2
- [ ] **Admin**: Upload file to Assignment 1, keep default visibility (visible)
- [ ] **Admin**: Set Assignment 1 as "Open View"
- [ ] **Team 1**: Should see admin file in "Other Team Files" (visible + assignment open)
- [ ] **Team 2**: Should see admin file in "Other Team Files" (visible + assignment open)
- [ ] **Admin**: Hide the admin file (toggle visibility off)
- [ ] **Team 1**: Refresh - should NOT see admin file (hidden overrides assignment open)
- [ ] **Team 2**: Refresh - should NOT see admin file (hidden overrides assignment open)
- [ ] **Admin**: Show the admin file again (toggle visibility on)
- [ ] **Team 1**: Should see admin file again (visible + assignment open)
- [ ] **Team 2**: Should see admin file again (visible + assignment open)
- [ ] **Admin**: Close Assignment 1 (turn off "Open View")
- [ ] **Team 1**: Should still see admin file (admin visibility independent of assignment settings)
- [ ] **Team 2**: Should still see admin file (admin visibility independent of assignment settings)

### I3. Multi-Team Assignment File Sharing
- [ ] **Team 1**: Upload files to Assignment 1
- [ ] **Team 2**: Upload files to Assignment 1  
- [ ] **Admin**: Keep Assignment 1 closed (not "Open View")
- [ ] **Team 1**: Should only see own files in "Other Team Files"
- [ ] **Team 2**: Should only see own files in "Other Team Files"
- [ ] **Admin**: Open Assignment 1 ("Open View" = true)
- [ ] **Team 1**: Should see Team 2's files in "Other Team Files"
- [ ] **Team 2**: Should see Team 1's files in "Other Team Files"

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

### E2. Authentication & Session Management (NEW - Passport.js)
- [ ] **Session Persistence**: Login as team, close browser, reopen - should stay logged in
- [ ] **Session Timeout**: Login, wait for session timeout, try actions (should redirect to login)
- [ ] **Concurrent Logins**: Login as Team 1 in one browser, Team 2 in another (should work)
- [ ] **Logout Functionality**: Test logout button, verify full session cleanup
- [ ] **Manual Cookie Clearing**: Clear cookies manually, try to access protected routes
- [ ] **Registration During Session**: Login as Team 1, try to register Team 2 (should work)
- [ ] **Password Change Impact**: Change password, verify old sessions become invalid

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
- [ ] **NEW**: Team registration and login (T1, T2) 
- [ ] **NEW**: Admin file visibility independent of assignment settings (I2 - CRITICAL)
- [ ] Admin file visibility to students (S5, I1)
- [ ] File editing modal fixes (A4 - cancel, save, persistence)
- [ ] "Warrier" labeling instead of "Team 0" (A7, S5)

**Required for Full Feature Set:**
- [ ] **NEW**: Environment variable fallback authentication (T3)
- [ ] **NEW**: Password management system (T4)
- [ ] **NEW**: Multi-team file sharing logic (I3)
- [ ] Assignment open view controls (A8)
- [ ] Cross-user integration (I1, I2, I3)
- [ ] **NEW**: Passport.js session management (E2)
- [ ] Error handling (E1, E3)
- [ ] Navigation and UI (U1, U2, U3)

**Production Ready (Database Required):**
- [ ] All test cases above
- [ ] **NEW**: Database authentication migration (T3, P2)
- [ ] Performance tests (PR1, PR2)
- [ ] Data persistence (P1, P2)

## NEW CRITICAL TEST: Admin File Visibility Bug Fix

**This test is ESSENTIAL** - the previous bug allowed admin files to be visible when they were marked as hidden, if their assignment was set to "Open View". 

**Test Scenario I2** above specifically tests this fix. **MUST PASS** for production deployment.

---

*Last Updated: August 9, 2025*
*Test Environment: Development (Memory Storage)*
*Production Environment: PostgreSQL Database*