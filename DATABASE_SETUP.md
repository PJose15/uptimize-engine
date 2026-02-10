# Database Setup Instructions

## Install Prisma (Run these commands manually)

```bash
# Stop the dev server first (Ctrl+C)
npm install prisma @prisma/client --force

# Generate Prisma client
npx prisma generate

# Create database and run migration
npx prisma migrate dev --name init

# Start dev server again
npm run dev
```

## What This Does

1. **Installs Prisma** - ORM and client library
2. **Generates client** - TypeScript types for database
3. **Creates database** - `prisma/dev.db` SQLite file
4. **Runs migration** - Creates all tables

## Verify Setup

```bash
# Check database was created
npx prisma studio

# This opens prisma://localhost:5555 in browser
```

## Troubleshooting

If install fails with engine errors:
- Make sure Node.js version is compatible
- Try `npm install --legacy-peer-deps prisma @prisma/client`
- Or use `--force` flag

## Next Steps

After successful setup:
1. Migrate existing data (we'll create a script)
2. Update services to use Prisma
3. Test database operations
