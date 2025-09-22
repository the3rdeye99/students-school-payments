import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb-local';
import Bill from '@/models/Bill';
import type { BillRow } from '@/types/bill';
import mongoose from 'mongoose';

// Helper function to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

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
    
    console.log('Processing', bills.length, 'bills');
    
    let lastSn = '000';
    const existingBill = await Bill.findOne().sort({ sn: -1 });
    if (existingBill) {
      lastSn = existingBill.sn;
    }
    
    console.log('Starting with lastSn:', lastSn);
    
    const savePromises = bills.map(async (bill, index) => {
      const { id, _id, ...billData } = bill as any;
      
      console.log(`Processing bill ${index + 1}: ${bill.name}, _id: ${_id}`);
      
      // If we have a MongoDB _id, validate it first and then update
      if (_id) {
        // CRITICAL FIX: Only proceed if _id is a valid MongoDB ObjectId
        if (isValidObjectId(_id)) {
          console.log('Valid ObjectId detected, attempting update:', _id);
          try {
            const existing = await Bill.findById(_id);
            const updateData: any = { ...billData };
            // Auto-set paymentDate when amtPaid increases or becomes > 0
            const prevPaid = parseFloat(existing?.amtPaid || '0') || 0;
            const nextPaid = parseFloat(billData?.amtPaid || '0') || 0;
            const delta = nextPaid - prevPaid;
            if (nextPaid > 0 && nextPaid !== prevPaid) {
              updateData.paymentDate = new Date();
            }
            const updateOps: any = { $set: updateData };
            if (delta > 0) {
              updateOps.$push = { payments: { amount: delta, date: new Date() } };
            }
            const updatedBill = await Bill.findByIdAndUpdate(
              _id,
              updateOps,
              { new: true, runValidators: true }
            );
            if (updatedBill) {
              console.log('Successfully updated bill:', _id);
              return updatedBill;
            } else {
              console.log('Bill not found with ObjectId, will create new:', _id);
            }
          } catch (updateError) {
            console.error('Error updating bill with ObjectId:', _id, updateError);
            // Continue to create new bill logic below
          }
        } else {
          console.log('Invalid/temporary _id detected, ignoring:', _id);
          // Continue to create new bill logic below
        }
      }
      
      // Check for existing bill with same details
      const existingBill = await Bill.findOne({
        name: bill.name,
        school: bill.school,
        academicYear: bill.academicYear,
      });

      if (existingBill) {
        console.log('Found existing bill by name/school/year, updating:', existingBill._id);
        // Update existing bill
        const updateData: any = { ...billData };
        const prevPaid = parseFloat(existingBill.amtPaid || '0') || 0;
        const nextPaid = parseFloat(billData?.amtPaid || '0') || 0;
        const delta = nextPaid - prevPaid;
        if (nextPaid > 0 && nextPaid !== prevPaid) {
          updateData.paymentDate = new Date();
        }
        const updateOps: any = { $set: updateData };
        if (delta > 0) {
          updateOps.$push = { payments: { amount: delta, date: new Date() } };
        }
        const updatedBill = await Bill.findByIdAndUpdate(
          existingBill._id,
          updateOps,
          { new: true, runValidators: true }
        );
        return updatedBill;
      } else {
        // Generate new serial number for new bills
        const newSn = String(Number(lastSn) + index + 1).padStart(3, '0');
        
        console.log('Creating new bill with sn:', newSn);
        
        // Create new bill
        const createData: any = {
          ...billData,
          sn: newSn
        };
        const nextPaid = parseFloat(billData?.amtPaid || '0') || 0;
        if (nextPaid > 0) {
          createData.paymentDate = new Date();
          createData.payments = [{ amount: nextPaid, date: new Date() }];
        }
        const newBill = await Bill.create(createData);
        
        console.log('Created new bill:', newBill._id);
        return newBill;
      }
    });

    const results = await Promise.allSettled(savePromises);
    
    // Process results to handle any failures
    const savedBills: any[] = [];
    const errors: { index: number; billName: string; error: string }[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        savedBills.push(result.value);
      } else {
        // result.reason only exists if status is 'rejected'
        const errorReason =
          result.status === 'rejected'
            ? (result.reason instanceof Error
                ? result.reason.message
                : typeof result.reason === 'string'
                  ? result.reason
                  : JSON.stringify(result.reason))
            : 'Unknown error';
        console.error(`Failed to save bill at index ${index}:`, errorReason);
        errors.push({
          index,
          billName: bills[index].name,
          error: errorReason
        });
      }
    });
    
    console.log(`Save completed: ${savedBills.length} successful, ${errors.length} failed`);
    
    // Get all bills after saving to return updated list
    const updatedBills = await Bill.find({
      academicYear: bills[0]?.academicYear // Get bills for same academic year
    }).sort({ sn: 1 });

    if (errors.length > 0) {
      return NextResponse.json({
        success: savedBills.length > 0, // Partial success
        message: `Saved ${savedBills.length} of ${bills.length} bills`,
        data: updatedBills,
        errors: errors,
        warnings: errors.map(e => `Failed to save "${e.billName}": ${e.error}`)
      }, { status: savedBills.length > 0 ? 200 : 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bills saved successfully',
      data: updatedBills
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error saving bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save bills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}