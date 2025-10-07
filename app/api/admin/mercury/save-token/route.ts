import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate JWT format (basic check)
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtPattern.test(token)) {
      return NextResponse.json(
        { error: 'Invalid JWT token format' },
        { status: 400 }
      );
    }

    // Path to .env file
    const envPath = join(process.cwd(), '.env');

    try {
      // Read current .env file
      const envContent = await readFile(envPath, 'utf-8');

      // Split into lines
      const lines = envContent.split('\n');

      // Find and update/add MERCURY_ACCESS_TOKEN
      let tokenFound = false;
      const updatedLines = lines.map(line => {
        if (line.startsWith('MERCURY_ACCESS_TOKEN=') || line.startsWith('#MERCURY_ACCESS_TOKEN=')) {
          tokenFound = true;
          return `MERCURY_ACCESS_TOKEN="${token}"`;
        }
        return line;
      });

      // If token line not found, add it after Mercury config section
      if (!tokenFound) {
        // Find Mercury section
        const mercuryIndex = updatedLines.findIndex(line =>
          line.includes('MERCURY_SANDBOX_MODE') || line.includes('Mercury API')
        );

        if (mercuryIndex !== -1) {
          updatedLines.splice(mercuryIndex + 1, 0, `MERCURY_ACCESS_TOKEN="${token}"`);
        } else {
          // Add at end if Mercury section not found
          updatedLines.push(`MERCURY_ACCESS_TOKEN="${token}"`);
        }
      }

      // Write updated content back
      const newContent = updatedLines.join('\n');
      await writeFile(envPath, newContent, 'utf-8');

      console.log('[Mercury Admin] Token saved successfully');

      return NextResponse.json({
        success: true,
        message: 'Token saved successfully to .env file. Server restart required for changes to take effect.'
      });

    } catch (fileError) {
      console.error('[Mercury Admin] Error updating .env file:', fileError);
      return NextResponse.json(
        { error: 'Failed to update .env file', details: fileError instanceof Error ? fileError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Mercury Admin] Error saving token:', error);
    return NextResponse.json(
      { error: 'Failed to save token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
