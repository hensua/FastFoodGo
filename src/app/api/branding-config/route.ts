import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// This API route securely reads the branding config file from the server's filesystem
// and makes it available to the client via a fetch request.
// This prevents client-side code from needing 'fs' access.
export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'src', 'lib', 'branding-config.json');
    const fileContents = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(fileContents);
    
    // Return the config with headers to prevent caching on the client.
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Failed to read branding config:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
