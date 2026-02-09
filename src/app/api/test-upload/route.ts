import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Test API called');
    console.log('Content-Type:', request.headers.get('content-type'));

    // Try JSON first
    try {
      const jsonData = await request.json();
      if (jsonData.fileData) {
        const buffer = Buffer.from(jsonData.fileData, 'base64');
        console.log('JSON upload - buffer length:', buffer.length);
        return NextResponse.json({
          success: true,
          message: 'JSON upload successful',
          bufferLength: buffer.length,
          fileName: jsonData.fileName
        });
      }
    } catch (jsonError) {
      console.log('JSON parse failed, trying FormData...');
    }

    // Try FormData
    const formData = await request.formData();
    const files = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = await value.arrayBuffer();
        files.push({
          name: value.name,
          size: value.size,
          bufferLength: buffer.byteLength
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'FormData upload successful',
      files: files
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}