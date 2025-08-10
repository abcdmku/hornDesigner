name: "Base PRP Template v2 - Context-Rich with Validation Loops"
description: |

## Purpose
Template optimized for AI agents to implement features with sufficient context and self-validation capabilities to achieve working code through iterative refinement.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
[What needs to be built - be specific about the end state and desires]
## Validation Loop

### Level 1: Syntax & Style
```powershell
# Run these FIRST - fix any errors before proceeding
npx eslint src/newFeature.ts --fix  # Auto-fix what's possible
npx tsc --noEmit                   # Type checking
# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests for each new feature/file/function using existing test patterns
```typescript
// CREATE tests/newFeature.test.ts with these test cases:
import { newFeature } from '../src/newFeature';

```yaml
  const result = await newFeature('valid_input');
  expect(result.status).toBe('success');
});

Task 1:
  await expect(newFeature('')).rejects.toThrow('ValidationError');
});

MODIFY src/existingModule.ts:
  jest.spyOn(externalApi, 'call').mockRejectedValueOnce(new Error('TimeoutError'));
  const result = await newFeature('valid');
  expect(result.status).toBe('error');
  expect(result.message).toContain('timeout');
});
```

```powershell
# Run and iterate until passing:
npx vitest run
# If failing: Read error, understand root cause, fix code, re-run (never mock to pass)
```

### Level 3: Integration Test
```powershell
# Start the service
npx ts-node src/main.ts

# Test the endpoint
curl -X POST http://localhost:8000/feature ^
  -H "Content-Type: application/json" ^
  -d '{"param": "test_value"}'

# Expected: {"status": "success", "data": {...}}
# If error: Check logs at logs/app.log for stack trace
```

## Final validation Checklist
- [ ] All tests pass: `npx vitest run`
- [ ] No linting errors: `npx eslint src/`
- [ ] No type errors: `npx tsc --noEmit`
- [ ] Manual test successful: [specific curl/command]
- [ ] Error cases handled gracefully
- [ ] Logs are informative but not verbose
- [ ] Documentation updated if needed

---

## Anti-Patterns to Avoid
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"
- ❌ Don't ignore failing tests - fix them
- ❌ Don't use sync functions in async context
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific
  - FIND pattern: "export class OldImplementation"
  - INJECT after constructor
  - PRESERVE existing method signatures

CREATE src/newFeature.ts:
  - MIRROR pattern from: src/similarFeature.ts
  - MODIFY class name and core logic
  - KEEP error handling pattern identical

...(...)

Task N:
...
```


### Per task pseudocode as needed added to each task
```typescript
// Task 1
// Pseudocode with CRITICAL details, don't write entire code
export async function newFeature(param: string): Promise<Result> {
  // PATTERN: Always validate input first (see src/validators.ts)
  const validated = validateInput(param); // throws ValidationError

  // GOTCHA: Use connection pooling (see src/database/pool.ts)
  const conn = await getConnection();
  try {
    // PATTERN: Use existing retry utility
    const result = await retry(async () => {
      // CRITICAL: API returns 429 if >10 req/sec
      await rateLimiter.acquire();
      return await externalApi.call(validated);
    }, { attempts: 3, backoff: 'exponential' });

    // PATTERN: Standardized response format
    return formatResponse(result); // see src/utils/responseHelpers.ts
  } finally {
    conn.release();
  }
}
```

### Integration Points
```yaml
DATABASE:
  - migration: "Add column 'featureEnabled' to users table (TypeORM migration)"
  - index: "CREATE INDEX idx_feature_lookup ON users(featureId)"

CONFIG:
  - add to: src/config/settings.ts
  - pattern: "export const FEATURE_TIMEOUT = Number(process.env.FEATURE_TIMEOUT ?? '30');"

ROUTES:
  - add to: src/api/routes.ts
  - pattern: "router.use('/feature', featureRouter);"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
ruff check src/new_feature.py --fix  # Auto-fix what's possible
mypy src/new_feature.py              # Type checking

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests each new feature/file/function use existing test patterns
```python
# CREATE test_new_feature.py with these test cases:
def test_happy_path():
    """Basic functionality works"""
    result = new_feature("valid_input")
    assert result.status == "success"

def test_validation_error():
    """Invalid input raises ValidationError"""
    with pytest.raises(ValidationError):
        new_feature("")

def test_external_api_timeout():
    """Handles timeouts gracefully"""
    with mock.patch('external_api.call', side_effect=TimeoutError):
        result = new_feature("valid")
        assert result.status == "error"
        assert "timeout" in result.message
```

```bash
# Run and iterate until passing:
uv run pytest test_new_feature.py -v
# If failing: Read error, understand root cause, fix code, re-run (never mock to pass)
```

### Level 3: Integration Test
```bash
# Start the service
uv run python -m src.main --dev

# Test the endpoint
curl -X POST http://localhost:8000/feature \
  -H "Content-Type: application/json" \
  -d '{"param": "test_value"}'

# Expected: {"status": "success", "data": {...}}
# If error: Check logs at logs/app.log for stack trace
```

## Final validation Checklist
- [ ] All tests pass: `uv run pytest tests/ -v`
- [ ] No linting errors: `uv run ruff check src/`
- [ ] No type errors: `uv run mypy src/`
- [ ] Manual test successful: [specific curl/command]
- [ ] Error cases handled gracefully
- [ ] Logs are informative but not verbose
- [ ] Documentation updated if needed

---

## Anti-Patterns to Avoid
- ❌ Don't create new patterns when existing ones work
- ❌ Don't skip validation because "it should work"  
- ❌ Don't ignore failing tests - fix them
- ❌ Don't use sync functions in async context
- ❌ Don't hardcode values that should be config
- ❌ Don't catch all exceptions - be specific