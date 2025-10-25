import { NextRequest, NextResponse } from 'next/server';
import { LocalStagingDB } from '@/lib/db/local-staging';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId parameter is required' }, { status: 400 });
    }
    
    console.log(`Migrating financial schema for job ${jobId}`);
    
    const localDb = new LocalStagingDB(jobId);
    
    // Add missing columns to staging_financials table
    const columnsToAdd = [
      'revenue TEXT',
      'profit TEXT', 
      'employees TEXT',
      'be TEXT',
      'tr TEXT'
    ];
    
    let addedColumns = 0;
    
    for (const column of columnsToAdd) {
      try {
        const [columnName] = column.split(' ');
        localDb.db.prepare(`ALTER TABLE staging_financials ADD COLUMN ${column}`).run();
        console.log(`Added column: ${columnName}`);
        addedColumns++;
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`Column already exists: ${column.split(' ')[0]}`);
        } else {
          console.error(`Error adding column ${column}:`, error.message);
        }
      }
    }
    
    // Check final schema
    const finalSchema = localDb.db.prepare("PRAGMA table_info(staging_financials)").all();
    
    return NextResponse.json({
      success: true,
      message: `Migration completed. Added ${addedColumns} columns.`,
      finalColumnCount: finalSchema.length,
      addedColumns: addedColumns
    });
    
  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
