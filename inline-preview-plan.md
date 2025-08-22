# Inline Preview Plan for Documents

## Feasibility Analysis

### Yes, it's possible to preview documents in the browser with varying levels of success:

## PDF Files ✅ **Already Implemented**
- **Current status**: Working with iframe
- **Method**: Direct iframe embedding with `src="/api/files/${id}/download#toolbar=1"`
- **Pros**: Native browser support, good compatibility
- **Cons**: Some PDFs may not render properly depending on browser

## PowerPoint Files (.pptx) ⚠️ **Challenging**
- **Feasibility**: Possible but complex
- **Methods**:
  1. **Server-side conversion** to images/HTML using libraries like `libreoffice-convert` or `mammoth`
  2. **Client-side libraries** like `pptx2html` or `officegen-pptx-viewer`
  3. **Third-party services** like Google Docs Viewer or Office Online
- **Recommended approach**: Server-side conversion to image slides
- **Implementation complexity**: High - requires additional dependencies

## Word Documents (.docx) ⚠️ **Moderately Challenging**
- **Feasibility**: Good with proper libraries
- **Methods**:
  1. **Server-side conversion** using `mammoth.js` to convert to HTML
  2. **Client-side conversion** using `docx-preview` library
- **Recommended approach**: Server-side conversion with `mammoth.js`
- **Implementation complexity**: Medium

## Text Files (.txt) ✅ **Easy**
- **Feasibility**: Very easy
- **Method**: Fetch content and display in `<pre>` or styled container
- **Implementation complexity**: Low

## Excel Files (.xlsx) ⚠️ **Complex**
- **Feasibility**: Possible but complex
- **Methods**:
  1. **Client-side libraries** like `xlsx` and `luckysheet` for spreadsheet viewing
  2. **Server-side conversion** to HTML table or CSV
- **Recommended approach**: Client-side with `xlsx` library
- **Implementation complexity**: High

## Implementation Strategy

### Phase 1: Easy Wins (Recommended First)
1. **Text Files (.txt)**: Simple fetch and display
2. **Improve PDF**: Already working, maybe add zoom controls

### Phase 2: Medium Complexity
1. **Word Documents (.docx)**: Server-side conversion with mammoth.js
   - Install: `npm install mammoth`
   - Create endpoint: `/api/files/:id/preview/docx`
   - Convert to HTML and return styled content

### Phase 3: Complex Features
1. **PowerPoint (.pptx)**: Convert to image slides or HTML
2. **Excel (.xlsx)**: Interactive spreadsheet viewer

## Technical Architecture

### Backend Changes Needed
```typescript
// New route in routes.ts
app.get("/api/files/:id/preview/:type", async (req, res) => {
  const { id, type } = req.params;
  // Handle different document types
  switch (type) {
    case 'docx':
      return handleDocxPreview(req, res);
    case 'txt':
      return handleTxtPreview(req, res);
    // etc.
  }
});
```

### Frontend Changes Needed
```typescript
// Add to getPreviewContent() function
if (type.includes('.docx')) {
  return <DocxPreview fileId={file.id} />;
}
if (type.includes('.txt')) {
  return <TextPreview fileId={file.id} />;
}
```

## Dependencies Required

### For Word Documents
- `mammoth`: Server-side DOCX to HTML conversion
- Alternative: `docx-preview` (client-side)

### For PowerPoint
- `libreoffice-convert`: Server-side conversion (requires LibreOffice installed)
- `pptx2html`: Client-side conversion (limited support)

### For Excel
- `xlsx`: Parse and display spreadsheet data
- `luckysheet`: Full-featured spreadsheet viewer (large bundle)

### For Text Files
- No dependencies needed, just fetch and display

## Security Considerations
- Validate file types server-side
- Sanitize HTML output from document conversions
- Limit file size for preview conversion
- Rate limiting on preview endpoints

## Performance Considerations
- Cache converted previews
- Lazy load preview content
- Consider background processing for large files
- Set timeouts for conversion processes

## Browser Compatibility
- PDF: Good (90%+ browsers)
- DOCX/PPTX: Depends on conversion method
- TXT: Excellent (100%)
- XLSX: Good with proper libraries

## Recommendation
Start with **Text files (.txt)** and **improved PDF controls** as they're easy to implement and provide immediate value. Then move to **Word documents (.docx)** using mammoth.js for server-side conversion.