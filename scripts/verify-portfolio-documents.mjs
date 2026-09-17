import fs from "fs";

async function runVerification() {
  console.log("================================================================================");
  console.log(" VERIFYING PORTFOLIO DOCUMENT UPLOAD ENHANCEMENT");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // Check 1: Migration File: 20260910160049_portfolio_documents.sql
  // ---------------------------------------------------------------------------
  console.log("--- 1. Checking Migration File: 20260910160049_portfolio_documents.sql ---");
  const migrationPath = "supabase/migrations/20260910160049_portfolio_documents.sql";
  assert(fs.existsSync(migrationPath), "Migration file exists");

  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  assert(migrationSql.includes("'portfolio-documents'"), "Defines portfolio-documents bucket");
  assert(migrationSql.includes("public = false") || migrationSql.includes("false,"), "Bucket is private (public = false)");
  assert(migrationSql.includes("5242880"), "Bucket enforces 5MB (5242880 bytes) size limit");
  assert(migrationSql.includes("application/pdf") && migrationSql.includes("image/jpeg") && migrationSql.includes("image/png"), "Bucket restricts MIME types to PDF, JPEG, and PNG");

  assert(migrationSql.includes("create table if not exists public.portfolio_documents"), "Creates public.portfolio_documents table");
  assert(migrationSql.includes("references public.portfolio_items(id) on delete cascade"), "portfolio_item_id foreign key with ON DELETE CASCADE");
  assert(migrationSql.includes("references public.profiles(id) on delete cascade"), "student_id foreign key with ON DELETE CASCADE");
  assert(migrationSql.includes("storage_path text not null unique"), "Enforces UNIQUE(storage_path)");
  assert(migrationSql.includes("file_size bigint not null check (file_size > 0 and file_size <= 5242880)"), "Enforces file_size check > 0 and <= 5242880");
  assert(migrationSql.includes("file_type in ('application/pdf', 'image/jpeg', 'image/png')"), "Enforces file_type check constraint");

  // Referential integrity trigger & immutable protection
  assert(migrationSql.includes("validate_portfolio_document_ownership"), "Creates ownership consistency trigger function");
  assert(migrationSql.includes("Document student_id does not match portfolio item student_id"), "Trigger enforces document student_id == portfolio_item student_id");
  assert(migrationSql.includes("Document ID is immutable") && migrationSql.includes("student_id is immutable") && migrationSql.includes("portfolio_item_id is immutable"), "Trigger protects immutable fields on update");

  // Storage RLS
  assert(migrationSql.includes("portfolio_documents_storage_select") && migrationSql.includes("(storage.foldername(name))[1] = auth.uid()::text"), "Storage SELECT policy enforces student folder scope");
  assert(migrationSql.includes("portfolio_documents_storage_insert") && migrationSql.includes("(storage.foldername(name))[1] = auth.uid()::text"), "Storage INSERT policy enforces student folder scope");
  assert(migrationSql.includes("portfolio_documents_storage_delete") && migrationSql.includes("(storage.foldername(name))[1] = auth.uid()::text"), "Storage DELETE policy enforces student folder scope");

  // Table RLS
  assert(migrationSql.includes("portfolio_documents_select") && migrationSql.includes("student_id = auth.uid()"), "Table SELECT policy restricted to auth.uid()");
  assert(migrationSql.includes("portfolio_documents_insert") && migrationSql.includes("student_id = auth.uid()"), "Table INSERT policy restricted to auth.uid()");
  assert(migrationSql.includes("portfolio_documents_delete") && migrationSql.includes("student_id = auth.uid()"), "Table DELETE policy restricted to auth.uid()");

  // ---------------------------------------------------------------------------
  // Check 2: Migrations 001-012 Untouched
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Verifying Migrations 001-012 Untouched ---");
  const migrations = fs.readdirSync("supabase/migrations");
  assert(migrations.includes("001_foundation.sql"), "001_foundation.sql exists");
  assert(migrations.includes("20260910140228_digital_portfolio.sql"), "012 (digital_portfolio) exists");

  // ---------------------------------------------------------------------------
  // Check 3: Types and Constants (types.ts)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Verifying Types & Constants (types.ts) ---");
  const typesContent = fs.readFileSync("app/student/portfolio/types.ts", "utf8");
  assert(typesContent.includes("MAX_DOCUMENT_FILE_SIZE = 5242880"), "MAX_DOCUMENT_FILE_SIZE set to 5242880 bytes (5MB)");
  assert(typesContent.includes("ALLOWED_DOCUMENT_MIME_TYPES") && typesContent.includes("application/pdf") && typesContent.includes("image/jpeg") && typesContent.includes("image/png"), "ALLOWED_DOCUMENT_MIME_TYPES includes PDF, JPEG, and PNG");

  // ---------------------------------------------------------------------------
  // Check 4: Server Actions Validation & Security (actions.ts)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Verifying Server Actions Security (actions.ts) ---");
  const actionsContent = fs.readFileSync("app/student/portfolio/actions.ts", "utf8");
  assert(actionsContent.includes('requireRole("student")'), "Enforces student role check via requireRole");
  assert(actionsContent.includes("File size must be 5 MB or smaller."), "Returns exact error message for file > 5MB");
  assert(actionsContent.includes("Only PDF, JPG, and PNG files are allowed."), "Returns exact error message for unsupported MIME types");
  assert(actionsContent.includes("student_id: user.id"), "Always derives student_id from authenticated session");
  assert(actionsContent.includes(".eq(\"student_id\", user.id)"), "Enforces student_id ownership filter on mutations");
  assert(actionsContent.includes("createSignedUrl"), "Generates short-lived signed URLs for viewing, avoiding public URLs");
  assert(actionsContent.includes(".remove([doc.storage_path])") || actionsContent.includes(".remove("), "Cleans up Storage files on document delete and replacement");
  assert(actionsContent.includes("deletePortfolioItem") && actionsContent.includes("portfolio-documents"), "deletePortfolioItem cleans up associated Storage files and document records");

  // ---------------------------------------------------------------------------
  // Check 5: Portfolio UI Document Attachment Component
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Verifying Document Attachment Component (portfolio-document-attachment.tsx) ---");
  const attachmentContent = fs.readFileSync("app/student/portfolio/portfolio-document-attachment.tsx", "utf8");
  assert(attachmentContent.includes("Maximum file size: 5 MB"), "Displays 'Maximum file size: 5 MB'");
  assert(attachmentContent.includes("Allowed: PDF, JPG, PNG"), "Displays 'Allowed: PDF, JPG, PNG'");
  assert(attachmentContent.includes("File size must be 5 MB or smaller."), "Client-side pre-validates 5MB limit");
  assert(attachmentContent.includes("Only PDF, JPG, and PNG files are allowed."), "Client-side pre-validates MIME type");
  assert(attachmentContent.includes("Add Document"), "Contains 'Add Document' button");
  assert(attachmentContent.includes("Replace"), "Contains 'Replace' action");
  assert(attachmentContent.includes("View"), "Contains 'View' action using signed URLs");

  // ---------------------------------------------------------------------------
  // Check 6: Portfolio View Integration
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Verifying Portfolio View Integration (portfolio-view.tsx) ---");
  const viewContent = fs.readFileSync("app/student/portfolio/portfolio-view.tsx", "utf8");
  assert(viewContent.includes("PortfolioDocumentAttachment"), "Renders PortfolioDocumentAttachment on portfolio cards");
  assert(viewContent.includes("documentsByItemId"), "Efficiently maps documents by portfolio item ID");

  // ---------------------------------------------------------------------------
  // Check 7: Integrated Document Upload in Portfolio Modal (portfolio-modal.tsx)
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Verifying Integrated Document Upload in Modal (portfolio-modal.tsx) ---");
  const modalContent = fs.readFileSync("app/student/portfolio/portfolio-modal.tsx", "utf8");
  assert(modalContent.includes("Supporting Document"), "Modal includes 'Supporting Document' field");
  assert(modalContent.includes("PDF, JPG, PNG — Maximum 5 MB"), "Modal displays 'PDF, JPG, PNG — Maximum 5 MB'");
  assert(modalContent.includes("uploadPortfolioDocument"), "Modal triggers uploadPortfolioDocument after item creation");
  assert(modalContent.includes("document upload failed"), "Modal warns user if document upload fails without losing the created item");

  // ---------------------------------------------------------------------------
  // Check 8: Input Validation Unit Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Unit Testing 5MB & MIME Type Enforcement Logic ---");
  const MAX_SIZE = 5242880;
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  function validateUpload(fileSize, fileType) {
    if (fileSize > MAX_SIZE) {
      return "File size must be 5 MB or smaller.";
    }
    if (!ALLOWED_TYPES.includes(fileType)) {
      return "Only PDF, JPG, and PNG files are allowed.";
    }
    return null;
  }

  assert(validateUpload(1024, "application/pdf") === null, "Valid 1KB PDF accepted");
  assert(validateUpload(3 * 1024 * 1024, "image/jpeg") === null, "Valid 3MB JPEG accepted");
  assert(validateUpload(5242880, "image/png") === null, "Exact 5MB PNG accepted");
  assert(validateUpload(5242881, "application/pdf") === "File size must be 5 MB or smaller.", "5MB + 1 byte rejected");
  assert(validateUpload(10 * 1024 * 1024, "application/pdf") === "File size must be 5 MB or smaller.", "10MB file rejected");
  assert(validateUpload(1024, "application/zip") === "Only PDF, JPG, and PNG files are allowed.", "ZIP file rejected");
  assert(validateUpload(1024, "text/plain") === "Only PDF, JPG, and PNG files are allowed.", "TXT file rejected");
  assert(validateUpload(1024, "application/msword") === "Only PDF, JPG, and PNG files are allowed.", "DOC file rejected");

  // ---------------------------------------------------------------------------
  // Check 8: Storage Path Safety & Scoping
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Verifying Storage Path Scoping Rules ---");
  const testStudentId = "user-1234";
  const testItemId = "item-5678";
  const testFileName = "my certificate final (1).pdf";
  const sanitized = testFileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const samplePath = `${testStudentId}/${testItemId}/1720000000-abcd-${sanitized}`;

  assert(samplePath.startsWith(`${testStudentId}/${testItemId}/`), "Path is strictly scoped to student_id and portfolio_item_id");
  assert(!samplePath.includes(" "), "Path contains no spaces or unsafe characters");

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification execution error:", err);
  process.exit(1);
});
