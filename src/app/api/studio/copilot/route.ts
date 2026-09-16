import { NextResponse } from 'next/server';
import { generateCreativeVariants } from '@/lib/services/creative-copilot-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantName, category, productBrief, currentHeadline, currentText } = body;

    if (!category) {
      return NextResponse.json({ error: 'Missing required parameter: category' }, { status: 400 });
    }

    const result = await generateCreativeVariants({
      merchantName: typeof merchantName === 'string' ? merchantName.slice(0, 80) : undefined,
      category: typeof category === 'string' ? category.slice(0, 50) : 'General',
      productBrief: typeof productBrief === 'string' ? productBrief.slice(0, 300) : undefined,
      currentHeadline: typeof currentHeadline === 'string' ? currentHeadline.slice(0, 100) : undefined,
      currentText: typeof currentText === 'string' ? currentText.slice(0, 300) : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Creative Copilot API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
