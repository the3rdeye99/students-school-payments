import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Bill from '@/models/Bill';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const bill = await Bill.findById(params.id);
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ bill }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await connectToDatabase();
    
    const bill = await Bill.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true
    });
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ bill }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const bill = await Bill.findByIdAndDelete(params.id);
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Bill deleted' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}