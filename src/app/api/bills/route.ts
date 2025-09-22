import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb-local';
import Bill from '@/models/Bill';
import type { BillRow } from '@/types/bill';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');

    let query = {};
    if (academicYear) {
      query = { academicYear };
    }

    const bills = await Bill.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const bills: BillRow[] = await request.json();
    await connectDB();
    
    let lastSn = '000';
    const existingBill = await Bill.findOne().sort({ sn: -1 });
    if (existingBill) {
      lastSn = existingBill.sn;
    }
    
    const savePromises = bills.map(async (bill, index) => {
      const { id, _id, ...billData } = bill as any;
      
      // If we have a MongoDB _id, update that document
      if (_id) {
        const updatedBill = await Bill.findByIdAndUpdate(
          _id,
          { ...billData },
          { new: true }
        );
        if (updatedBill) return updatedBill;
      }
      
      // Otherwise check for existing bill with same details
      const existingBill = await Bill.findOne({
        name: bill.name,
        school: bill.school,
        academicYear: bill.academicYear,
      });

      if (existingBill) {
        // Update existing bill
        const updatedBill = await Bill.findByIdAndUpdate(
          existingBill._id,
          { ...billData },
          { new: true }
        );
        return updatedBill;
      } else {
        // Generate new serial number for new bills
        const newSn = String(Number(lastSn) + index + 1).padStart(3, '0');
        
        // Create new bill
        const newBill = await Bill.create({
          ...billData,
          sn: newSn
        });
        return newBill;
      }
    });

    const savedBills = await Promise.all(savePromises);
    // Get all bills after saving to return updated list
    const updatedBills = await Bill.find({
      academicYear: bills[0]?.academicYear // Get bills for same academic year
    }).sort({ sn: 1 });

    return NextResponse.json({
      success: true,
      message: 'Bills saved successfully',
      data: updatedBills
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save bills' },
      { status: 500 }
    );
  }
}