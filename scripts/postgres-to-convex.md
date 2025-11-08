# Migration Scripts

## PostgreSQL to Convex Migration

### Prerequisites

1. **Install dependencies:**
   ```bash
   pnpm install tsx convex
   ```

2. **Set up Convex deployment:**
   ```bash
   pnpm convex dev  # For dev migration
   # OR
   pnpm convex deploy --prod  # For production migration
   ```

3. **Ensure environment variables are set:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL

### Running the Migration

**Development migration:**
```bash
# Make sure Convex dev is running in another terminal
pnpm convex dev

# In a new terminal, run the migration
pnpm tsx scripts/migrate-to-convex.ts
```

**Production migration:**
```bash
# Deploy Convex functions to production
pnpm convex deploy --prod

# Set CONVEX_URL to production deployment
export CONVEX_URL="https://your-production-deployment.convex.cloud"

# Run migration during maintenance window
pnpm tsx scripts/migrate-to-convex.ts
```

### What the Script Does

1. **Export** - Reads all events and attendees from PostgreSQL
2. **Transform** - Converts data to Convex format:
   - PostgreSQL UUIDs → Convex _id strings
   - PostgreSQL timestamps → Unix timestamps (milliseconds)
   - snake_case → camelCase
3. **Insert** - Bulk inserts data into Convex:
   - Events first (to get new _id mappings)
   - Attendees second (using new event _ids)
4. **Validate** - Verifies data integrity:
   - Row count validation
   - Sample record validation

### Output

```
🚀 Starting PostgreSQL → Convex migration

==================================================
📤 Exporting events from PostgreSQL...
✅ Exported 5 events

📤 Exporting attendees from PostgreSQL...
✅ Exported 23 attendees

📥 Inserting events into Convex...
  ✓ Migrated event: Tech Conference 2024 (uuid-123 → convex-id-abc)
  ✓ Migrated event: Workshop Series (uuid-456 → convex-id-def)
  ...
✅ Inserted 5 events into Convex

📥 Inserting attendees into Convex...
  ✓ Migrated attendee: John Doe (john@example.com)
  ✓ Migrated attendee: Jane Smith (jane@example.com)
  ...
✅ Inserted 23 attendees into Convex

🔍 Validating migration...
✅ Event count matches: 5
✅ Attendee count matches: 23
✅ Sample event validated: Tech Conference 2024

✅ Migration validation complete!

==================================================
🎉 Migration completed successfully!

Next steps:
  1. Verify data in Convex dashboard
  2. Test application with Convex backend
  3. Keep PostgreSQL data for rollback (N days)
```

### Rollback Plan

If you need to rollback:

1. **Keep PostgreSQL running** for N days after migration
2. **Don't delete PostgreSQL data** until you're confident in Convex
3. **Switch environment variables** back to PostgreSQL if needed
4. **Re-deploy** with tRPC/Drizzle code if necessary

### Troubleshooting

**Error: "CONVEX_URL environment variable is required"**
- Make sure you've run `convex dev` or `convex deploy --prod`
- Check that `.env.local` contains the Convex URL

**Error: "No Convex event ID found for PostgreSQL event"**
- This means an attendee references an event that doesn't exist
- Check your PostgreSQL data for orphaned foreign keys

**Count mismatch errors:**
- The migration script validates that all data was migrated
- If counts don't match, check the logs for failed insertions
- You may need to re-run the migration after fixing data issues

### Performance Notes

- **Batch size:** Attendees are inserted in batches of 10 (configurable in script)
- **Estimated time:** ~1 second per 10 records
- **For large datasets:** Consider increasing batch size or running during off-peak hours
