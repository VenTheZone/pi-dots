---
name: context7-tdd
description: Test-Driven Development powered by Context7 documentation. Write tests based on official library docs, verify implementations against authoritative sources.
---

# Context7-Driven TDD

Combine Context7 documentation lookup with Test-Driven Development to ensure your code matches official library patterns from the start.

## Core Workflow

### 1. Research Phase (Context7 First)

Before writing any test, query Context7 for the library/framework you're testing against:

**When to query:**
- Testing a new library integration
- Unsure about API behavior or edge cases
- Working with complex APIs (ORMs, auth, payments)
- Version-specific behavior matters

**How to query:**

```
1. Identify dependencies from package.json/imports
2. If Context7 tools are available, use context7_resolve-library-id to get the library ID
3. If Context7 tools are available, use context7_query-docs for specific "how to" questions
4. Otherwise use official docs, project docs, or web search to gather the same guidance manually
5. Focus on: initialization patterns, error handling, best practices
```

**Example queries:**
- "How to set up JWT authentication with NextAuth.js"
- "React useEffect cleanup function examples"
- "Express.js middleware error handling patterns"
- "How to handle transactions in TypeORM"

### 2. Test Design Phase

Based on Context7 documentation, design tests that verify:

**Happy Path:**
- Does it follow the documented initialization pattern?
- Are we using the API correctly per official docs?

**Error Cases:**
- What errors does the library throw? (check docs)
- How should we handle edge cases?

**Integration Points:**
- Does our code match the library's expected input/output?
- Are we following documented best practices?

### 3. Write Tests (Red Phase)

Write failing tests that assert behavior according to official documentation:

```typescript
// Example: Testing React Query based on Context7 docs
import { renderHook, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';

describe('useUserData', () => {
  it('should cache data according to React Query best practices', async () => {
    // Test based on documented caching behavior
    const { result } = renderHook(() => useUserData('123'));
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Verify caching behavior matches official docs
    expect(result.current.data).toEqual(mockUserData);
  });
  
  it('should handle errors as documented in React Query', async () => {
    // Test error handling patterns from official docs
    server.use(
      rest.get('/api/user/123', (req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    
    const { result } = renderHook(() => useUserData('123'));
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
```

### 4. Implement (Green Phase)

Write minimal implementation that satisfies tests AND follows Context7 docs:

```typescript
// Implementation following Context7-verified patterns
import { useQuery } from '@tanstack/react-query';

export function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    // Configuration based on Context7-verified best practices
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
```

### 5. Refactor Phase

After tests pass, verify against Context7 docs:

**Checklist:**
- [ ] Does the implementation match official examples?
- [ ] Are we using the recommended error handling?
- [ ] Is our configuration following best practices?
- [ ] Query Context7 again if unsure about refactoring direction

## Common Patterns

### Pattern: Testing Database Operations

```typescript
// Query Context7 first: "How to use Prisma with transactions"
// Then write tests:

describe('createOrder', () => {
  it('should use transaction for order creation', async () => {
    const orderData = { /* ... */ };
    
    await createOrder(orderData);
    
    // Verify transaction was used (check logs or mock)
    expect(prisma.$transaction).toHaveBeenCalled();
  });
  
  it('should rollback on failure', async () => {
    // Simulate failure condition
    jest.spyOn(prisma.order, 'create').mockRejectedValue(new Error('DB error'));
    
    await expect(createOrder(orderData)).rejects.toThrow();
    
    // Verify rollback occurred
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Promise)])
    );
  });
});
```

### Pattern: Testing API Integrations

```typescript
// Query Context7: "How to handle rate limiting in Stripe API"

describe('createStripeCustomer', () => {
  it('should handle Stripe rate limiting', async () => {
    // Mock rate limit response based on Stripe docs
    stripeMock.customers.create.mockRejectedValue({
      type: 'StripeRateLimitError',
      headers: { 'retry-after': '2' }
    });
    
    // Implementation should retry per Stripe best practices
    await expect(createStripeCustomer(data)).rejects.toThrow();
    expect(stripeMock.customers.create).toHaveBeenCalledTimes(3); // Retry logic
  });
});
```

### Pattern: Testing Authentication

```typescript
// Query Context7: "How to implement JWT auth with NextAuth.js"

describe('authenticateUser', () => {
  it('should generate valid JWT per NextAuth spec', async () => {
    const user = await authenticateUser(credentials);
    
    // Verify JWT structure matches NextAuth documentation
    expect(user.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
  });
});
```

## Integration with Agent Workflow

When using the TDD guide agent with this skill:

1. **Agent queries Context7** before suggesting test structure
2. **Tests are designed** to verify documented behavior
3. **Implementation** follows official patterns verified by Context7
4. **Refactoring** maintains compliance with authoritative docs

## Tools Available

- `context7_resolve-library-id` - Get Context7-compatible library ID
- `context7_query-docs` - Query official documentation and examples
- Standard testing tools (read, bash, write, edit)

## Best Practices

1. **Always verify first** - Don't assume API behavior; check Context7
2. **Test the interface** - Tests verify your code uses the library correctly
3. **Version matters** - Specify library versions in queries when relevant
4. **Cross-reference** - If Context7 results are unclear, query again with different wording
5. **Document assumptions** - Comment tests that rely on specific Context7-verified behavior

## Example Session Flow

```
User: "I need to add Stripe payment processing"

Agent (with context7-tdd skill):
1. Query Context7: "How to create Stripe payment intents"
2. Design tests based on official Stripe patterns
3. Write failing tests (Red)
4. Implement minimal code following docs (Green)
5. Refactor while maintaining doc compliance
6. Run tests to verify
```
