const { spawnSync } = require('child_process');

function addOrReplaceVercelEnv(key, value) {
    console.log(`Removing ${key} if exists...`);
    spawnSync('vercel', ['env', 'rm', key, 'production', '-y'], {
        shell: true,
        stdio: 'ignore'
    });

    console.log(`Setting ${key}...`);
    const addResult = spawnSync('vercel', ['env', 'add', key, 'production'], {
        input: value,
        encoding: 'utf-8',
        shell: true
    });
    console.log(addResult.stdout);
    if (addResult.stderr) console.error(addResult.stderr);
}

const dbUrl = "postgres://postgres.npobomswhswnhnvpcgna:EY0ode7U8ff55m8k@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const directUrl = "postgres://postgres.npobomswhswnhnvpcgna:EY0ode7U8ff55m8k@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

addOrReplaceVercelEnv('EMPRENDE_DATABASE_URL', dbUrl);
addOrReplaceVercelEnv('EMPRENDE_DIRECT_URL', directUrl);
