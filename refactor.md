# TypeScript Refactoring Guide for Claude Code

## Core Philosophy: Simplify First, Split Later

**The most important rule:** Always simplify code BEFORE considering file splits. A clean 500-line file is better than five messy 100-line files.

### 1. Code Simplification Principles

**SIMPLIFY FIRST:**
- Remove dead code and unused imports
- Eliminate duplicate logic
- Simplify complex conditionals
- Extract reusable functions
- Improve variable/function names
- Remove unnecessary abstractions

**SPLIT ONLY WHEN:**
- File exceeds ~200 lines AFTER simplification
- Clear logical boundaries exist
- Multiple unrelated features in one file

### 2. Comment Policy

**MINIMAL COMMENTS:**
- NO comments unless absolutely necessary
- Code should be self-documenting through clear naming
- When comments are needed, use single-line `//` comments only
- AVOID multiline `/* */` comments - they clutter the code
- Remove TODO comments after addressing them

```typescript
// ❌ BAD: Multiline comment
/*
 * This function calculates the user's age
 * based on their birthdate
 */
function calculateAge(birthDate: Date) { ... }

// ❌ BAD: Obvious comment
function calculateAge(birthDate: Date) {
  // Get current date
  const now = new Date();
  // Calculate difference
  const diff = now - birthDate;
  // Return age
  return Math.floor(diff / YEAR_MS);
}

// ✅ GOOD: Self-documenting code, no comments needed
function calculateAgeInYears(birthDate: Date): number {
  const now = new Date();
  const ageInMilliseconds = now.getTime() - birthDate.getTime();
  return Math.floor(ageInMilliseconds / MILLISECONDS_PER_YEAR);
}

// ✅ OK: Single-line comment for complex business logic ONLY
function applyDiscount(price: number, customer: Customer): number {
  // Legacy customers get 20% off per 2019 contract terms
  if (customer.joinedBefore(2019)) return price * 0.8;
  return price;
}
```

### 3. Essential First Steps
```bash
# ALWAYS run these commands first
1. Read the file completely using Read tool
2. Check for existing tests: Glob "**/*.test.ts" "**/*.spec.ts"
3. Understand dependencies: Check package.json, tsconfig.json
4. Look for related files in same directory
5. Check for linting/formatting rules: .eslintrc, .prettierrc
```

### 4. Never Skip These
- **Read before Edit** - Claude Code requires reading files before editing
- **Check test coverage** - Run tests if they exist
- **Preserve exact formatting** - Match indentation (tabs vs spaces)
- **Follow existing patterns** - Don't introduce new libraries without checking

## Simplification-First Refactoring Workflow

### 5. The Safe Refactoring Process

```typescript
// Step 1: Create todo list for complex refactors
TodoWrite([
  { content: "Read and analyze current implementation", status: "pending" },
  { content: "Remove dead code and unused imports", status: "pending" },
  { content: "Simplify complex functions", status: "pending" },
  { content: "Improve naming for clarity", status: "pending" },
  { content: "Remove unnecessary comments", status: "pending" },
  { content: "Extract reusable logic", status: "pending" },
  { content: "ONLY if >400 lines: Consider file splits", status: "pending" },
  { content: "Run tests and linting", status: "pending" },
  { content: "Commit changes", status: "pending" }
])

// Step 2: Use MultiEdit for batch changes
MultiEdit({
  file_path: "/path/to/file.ts",
  edits: [
    { old_string: "exact string", new_string: "replacement" },
    // Multiple edits in sequence
  ]
})

// Step 3: Always verify
Bash("npm run typecheck")
Bash("npm run lint")
Bash("npm test")
```

### 6. Critical Claude Code Rules

#### Reading Files
```typescript
// ALWAYS read before editing
Read("/absolute/path/to/file.ts")

// For large files, use offset and limit
Read("/path/to/large-file.ts", { offset: 100, limit: 200 })
```

#### Making Edits
```typescript
// Single edit - must match EXACTLY including whitespace
Edit({
  file_path: "/absolute/path/file.ts",
  old_string: "  const foo = bar;", // Preserve exact indentation
  new_string: "  const foo = updatedBar;",
})

// Multiple edits - more efficient
MultiEdit({
  file_path: "/absolute/path/file.ts",
  edits: [
    { old_string: "import old", new_string: "import new" },
    { old_string: "oldFunction", new_string: "newFunction", replace_all: true }
  ]
})
```

## Code Simplification Patterns (Do These First!)

### 7. Remove Dead Code Pattern

```typescript
// Before: Unused code cluttering the file
Read("/path/to/file.ts")

// Find unused exports
Bash("npx ts-prune")

// Remove unused imports, variables, and functions
MultiEdit({
  file_path: "/path/to/file.ts",
  edits: [
    { old_string: "import { unused } from './module';", new_string: "" },
    { old_string: "const UNUSED_CONST = 'value';\n", new_string: "" },
    { old_string: "function unusedFunction() {\n  // function body\n}\n\n", new_string: "" }
  ]
})
```

### 8. Simplify Complex Conditionals

```typescript
// Before: Complex nested conditionals
Edit({
  file_path: "/path/to/file.ts",
  old_string: `if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return true;
      }
    }
  }
  return false;`,
  new_string: `return user?.isActive && user?.hasPermission || false;`
})

// Or extract to descriptive function
Edit({
  file_path: "/path/to/file.ts",
  old_string: `if (user?.isActive && user?.hasPermission) {`,
  new_string: `if (canUserAccess(user)) {`
})
```

### 9. Extract Function Pattern
```typescript
// Before reading and refactoring
Read("/path/to/file.ts")

// Identify the code block to extract
MultiEdit({
  file_path: "/path/to/file.ts",
  edits: [
    // First: Add the new function
    {
      old_string: "export class MyClass {",
      new_string: "function extractedFunction(param: Type): ReturnType {\n  // extracted logic\n}\n\nexport class MyClass;"
    },
    // Then: Replace the original code
    {
      old_string: "// long code block to extract",
      new_string: "const result = extractedFunction(param);"
    }
  ]
})
```

### 10. Type Safety Improvements
```typescript
// Remove 'any' types systematically
MultiEdit({
  file_path: "/path/to/file.ts",
  edits: [
    { old_string: "data: any", new_string: "data: UserData", replace_all: true },
    { old_string: "response: any", new_string: "response: ApiResponse" }
  ]
})
```

### 11. Async/Await Conversion
```typescript
// Convert promises to async/await
Edit({
  file_path: "/path/to/file.ts",
  old_string: `function fetchData(): Promise<Data> {
  return fetch(url)
    .then(res => res.json())
    .then(data => processData(data));
}`,
  new_string: `async function fetchData(): Promise<Data> {
  const res = await fetch(url);
  const data = await res.json();
  return processData(data);
}`
})
```

## React-Specific Refactoring

### 12. Extract Custom Hook (Simplification for React)
```typescript
// 1. First create the hook file
Write({
  file_path: "/path/to/hooks/useCustomHook.ts",
  content: `import { useState, useEffect } from 'react';

export function useCustomHook() {
  // Extracted logic
  return { /* values */ };
}`
})

// 2. Then update the component
MultiEdit({
  file_path: "/path/to/Component.tsx",
  edits: [
    { old_string: "import { useState", new_string: "import { useState\nimport { useCustomHook } from './hooks/useCustomHook';" },
    { old_string: "// hook logic in component", new_string: "const { values } = useCustomHook();" }
  ]
})
```

## Error Prevention Strategies

### 13. Common Pitfalls to Avoid

```typescript
// L DON'T: Edit without reading first
Edit({ file_path: "/path", old_string: "...", new_string: "..." })

//  DO: Always read first
Read("/path")
// Then edit

// L DON'T: Use relative paths
Edit({ file_path: "./file.ts", ... })

//  DO: Use absolute paths
Edit({ file_path: "/absolute/path/file.ts", ... })

// L DON'T: Include line numbers in old_string
Edit({ old_string: "42: const value", ... })

//  DO: Use only the actual content
Edit({ old_string: "const value", ... })
```

### 14. Handling Edit Failures

```typescript
// If edit fails due to non-unique string
// Solution 1: Add more context
Edit({
  old_string: "function calculate() {\n  const result = 1;\n  return result;",
  new_string: "function calculate() {\n  const result = computeValue();\n  return result;"
})

// Solution 2: Use replace_all if appropriate
Edit({
  old_string: "oldVariableName",
  new_string: "newVariableName",
  replace_all: true
})
```

## Testing Strategy

### 15. Test-Driven Refactoring

```typescript
// 1. Check existing tests
Glob("**/*.test.ts")
Glob("**/*.spec.ts")

// 2. Run tests before changes
Bash("npm test")

// 3. Make refactoring changes
MultiEdit({ /* ... */ })

// 4. Run tests after changes
Bash("npm test")

// 5. If tests fail, review and fix
Read("/path/to/test-file.test.ts")
```

## Performance Refactoring

### 16. React Performance Optimizations

```typescript
// Add memoization
MultiEdit({
  file_path: "/path/to/Component.tsx",
  edits: [
    { old_string: "import React from 'react'", new_string: "import React, { useMemo, useCallback } from 'react'" },
    { old_string: "const computed = expensive()", new_string: "const computed = useMemo(() => expensive(), [deps])" }
  ]
})
```

## Validation Checklist

### 17. Post-Refactor Verification

```bash
# Run these commands after EVERY refactor
TodoWrite([
  { content: "Run TypeScript compiler", status: "pending" },
  { content: "Run linter", status: "pending" },
  { content: "Run tests", status: "pending" },
  { content: "Check for unused imports", status: "pending" },
  { content: "Verify no console.logs added", status: "pending" }
])

# Execute validation
Bash("npx tsc --noEmit")
Bash("npm run lint")
Bash("npm test")
Grep("console.log", { path: "/path/to/refactored/file.ts" })
```

## Advanced Patterns

### 18. Dependency Injection Refactor

```typescript
// Transform tightly coupled code
MultiEdit({
  file_path: "/path/to/service.ts",
  edits: [
    // Add interface
    {
      old_string: "export class UserService {",
      new_string: "interface IDatabase {\n  query(sql: string): Promise<any>;\n}\n\nexport class UserService {"
    },
    // Add constructor injection
    {
      old_string: "export class UserService {",
      new_string: "export class UserService {\n  constructor(private db: IDatabase) {}"
    },
    // Update method calls
    {
      old_string: "database.query",
      new_string: "this.db.query",
      replace_all: true
    }
  ]
})
```

### 19. File Splitting (Last Resort - Only After Simplification)

**WARNING:** Only split files when:
- File is STILL >400-500 lines after all simplifications
- You have clear feature boundaries
- The split genuinely improves maintainability

```typescript
// BEFORE splitting, ensure you've:
// 1. Removed all dead code
// 2. Simplified all complex logic
// 3. Removed unnecessary comments
// 4. Consolidated duplicate code

// If file is STILL too large, then create types file
Write({
  file_path: "/path/to/types.ts",
  content: `export interface User {
  id: string;
  name: string;
}

export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };`
})

// 2. Update original file
MultiEdit({
  file_path: "/path/to/original.ts",
  edits: [
    { old_string: "interface User {", new_string: "import { User, ApiResponse } from './types';\n\n// Removed - moved to types.ts" },
    // Remove the interface definition
  ]
})
```

## Monorepo-Specific Refactoring

### 20. Cross-Package Refactoring

```typescript
// When refactoring shared code in monorepo
TodoWrite([
  { content: "Check all package dependencies", status: "pending" },
  { content: "Update shared package", status: "pending" },
  { content: "Update consuming packages", status: "pending" },
  { content: "Run build for all packages", status: "pending" }
])

// Find all usages across packages
Grep("SharedFunction", { path: "packages/" })
Grep("SharedFunction", { path: "apps/" })

// Update systematically
MultiEdit({ /* update shared package */ })
Bash("pnpm build --filter @repo/shared")
// Then update consumers
```

## Quick Reference

### 21. Essential Commands for Refactoring

```bash
# File discovery
Glob("**/*.ts")                    # Find all TypeScript files
Grep("functionName", {path: "/"})  # Find function usage

# Validation
Bash("npx tsc --noEmit")          # Type check
Bash("npm run lint")              # Lint check
Bash("npm test")                  # Run tests

# Code analysis
Grep("TODO", {path: "/src"})      # Find TODOs
Grep("any", {path: "/src"})       # Find 'any' types
Grep("console.log", {path: "/"})  # Find console logs

# Clean up
Bash("npx ts-prune")              # Find unused exports
Bash("npx depcheck")              # Find unused dependencies
```

### 22. Emergency Rollback

```bash
# If refactoring goes wrong
Bash("git status")                 # Check changes
Bash("git diff")                   # Review changes
Bash("git checkout -- .")         # Rollback all changes
# OR
Bash("git stash")                  # Stash changes for later
```

## Golden Rules

1. **Simplify before splitting** - Clean code in one file > messy code in many files
2. **Minimal comments** - Code should be self-documenting
3. **No multiline comments** - Use `//` only when absolutely necessary
4. **Always Read before Edit** - Claude Code requirement
5. **Use absolute paths** - Never relative paths
6. **Preserve formatting** - Match existing indentation exactly
7. **Test continuously** - Run tests after each change
8. **Use MultiEdit for efficiency** - Batch related changes
9. **Track with TodoWrite** - For complex refactors
10. **Validate with tools** - TypeScript, ESLint, tests
11. **Commit frequently** - After each successful refactor
12. **Follow existing patterns** - Don't introduce new styles

## Remember

- **Simplification > File Splitting** - Always simplify first
- **Self-documenting code > Comments** - Clear names eliminate need for comments
- **One clean file > Many messy files** - Don't split prematurely
- Small, incremental changes are safer than large rewrites
- The goal is improved code quality without breaking functionality
- Use Claude Code's tools effectively to ensure accuracy
- When in doubt, ask for clarification rather than assume

## Simplification Checklist

Before even considering file splits, ensure you've:

- [ ] Removed all dead code
- [ ] Eliminated unused imports
- [ ] Simplified complex conditionals
- [ ] Extracted duplicate logic into functions
- [ ] Improved all variable/function names
- [ ] Removed unnecessary comments
- [ ] Converted multiline comments to single-line (if needed)
- [ ] Removed TODO comments after addressing
- [ ] Consolidated related logic
- [ ] Removed unnecessary abstractions

Only after ALL of the above, if file is still >400-500 lines, consider splitting.