import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
let envVars = {};

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const firstEqual = line.indexOf('=');
    if (firstEqual > 0) {
      const key = line.substring(0, firstEqual).trim();
      const value = line.substring(firstEqual + 1).trim();
      envVars[key] = value;
    }
  });
} catch (e) {
  console.error('Error reading .env file:', e.message);
  process.exit(1);
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BACKUP_DIR = path.resolve(__dirname, '../backup');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const TABLES = ['settings', 'campaigns', 'characters', 'extra_files', 'character_comments'];
const BUCKET_NAME = 'images';

async function exportTable(tableName) {
  console.log(`Exporting table: ${tableName}...`);
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      console.error(`Error exporting ${tableName}:`, error.message);
      return;
    }

    const filePath = path.join(BACKUP_DIR, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} rows to ${filePath}`);
  } catch (e) {
    console.error(`Unexpected error exporting ${tableName}:`, e.message);
  }
}

async function downloadFile(bucket, filePath) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) {
      console.error(`Error downloading ${filePath}:`, error.message);
      return;
    }

    const buffer = await data.arrayBuffer();
    const localPath = path.join(BACKUP_DIR, 'images', filePath);
    const dir = path.dirname(localPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(localPath, Buffer.from(buffer));
    console.log(`Downloaded: ${filePath}`);
  } catch (e) {
    console.error(`Unexpected error downloading ${filePath}:`, e.message);
  }
}

async function exportStorage() {
  console.log(`Exporting storage bucket: ${BUCKET_NAME}...`);
  const imagesDir = path.join(BACKUP_DIR, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error('Error listing files:', error.message);
      return;
    }

    console.log(`Found ${data.length} files.`);

    for (const file of data) {
      if (file.name === '.emptyFolderPlaceholder') continue;
      await downloadFile(BUCKET_NAME, file.name);
    }
  } catch (e) {
    console.error('Unexpected error listing files:', e.message);
  }
}

async function main() {
  console.log('Starting Supabase Export...');
  
  for (const table of TABLES) {
    await exportTable(table);
  }

  await exportStorage();

  console.log('Export completed! Check the "backup" directory.');
}

main().catch(console.error);
