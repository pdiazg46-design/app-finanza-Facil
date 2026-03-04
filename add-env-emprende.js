const { execSync } = require('child_process');

function addEnv(key, value) {
    try {
        console.log(`Adding ${key}...`);
        execSync(`npx vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit']
        });
        console.log(`Success: ${key}`);
    } catch (e) {
        console.log(`Error adding ${key}:`, e.message);
    }
}

const dbUrl = "postgres://postgres.npobomswhswnhnvpcgna:EY0ode7U8ff55m8k@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const directUrl = "postgres://postgres.npobomswhswnhnvpcgna:EY0ode7U8ff55m8k@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

addEnv('EMPRENDE_DATABASE_URL', dbUrl);
addEnv('EMPRENDE_DIRECT_URL', directUrl);
