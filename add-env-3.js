const { spawnSync } = require('child_process');

function addVercelEnv(key, value) {
    console.log(`Setting ${key}...`);
    const result = spawnSync('vercel', ['env', 'add', key, 'production'], {
        input: value,  // writes string to stdin without trailing newline
        encoding: 'utf-8',
        shell: true
    });
    console.log(result.stdout);
    console.error(result.stderr);
}

const dbUrl = "postgres://postgres.npobomswhswnhnvpcgna:EY0ode7U8ff55m8k@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const directUrl = "postgres://postgres.npobomswhswnhnvpcgna:EY0ode7U8ff55m8k@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

addVercelEnv('EMPRENDE_DATABASE_URL', dbUrl);
addVercelEnv('EMPRENDE_DIRECT_URL', directUrl);
