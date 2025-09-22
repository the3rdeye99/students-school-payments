import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    // Normalize assist defaults for client display (no summing from payments)
    const mapped = await Promise.all(bills.map(async (b: any) => {
      const doc = b.toObject ? b.toObject() : b;
      const ensure = (v: any) => (v === undefined || v === null || v === '' ? '0' : String(v));
      let a1 = ensure(doc.assistPrimary1stTerm);
      let a2 = ensure(doc.assistPrimary2ndTerm);
      let a3 = ensure(doc.assistPrimary3rdTerm);
      let s1 = ensure(doc.assistSecondary1stTerm);
      let s2 = ensure(doc.assistSecondary2ndTerm);
      let s3 = ensure(doc.assistSecondary3rdTerm);
      let u1 = ensure(doc.assistUniversity1stSemester);
      let u2 = ensure(doc.assistUniversity2ndSemester);

      const allZero = [a1,a2,a3,s1,s2,s3,u1,u2].every(v => (parseFloat(v) || 0) === 0);
      const amtPaidNum = parseFloat(doc.amtPaid || '0') || 0;
      if (allZero && amtPaidNum > 0) {
        // Migration: place amtPaid into the first applicable period based on schoolType
        if (doc.schoolType === 'primary') {
          a1 = String(amtPaidNum);
        } else if (doc.schoolType === 'secondary') {
          s1 = String(amtPaidNum);
        } else if (doc.schoolType === 'university') {
          u1 = String(amtPaidNum);
        }
        // Persist once so it becomes stable
        try {
          await Bill.findByIdAndUpdate(doc._id, {
            $set: {
              assistPrimary1stTerm: a1,
              assistPrimary2ndTerm: a2,
              assistPrimary3rdTerm: a3,
              assistSecondary1stTerm: s1,
              assistSecondary2ndTerm: s2,
              assistSecondary3rdTerm: s3,
              assistUniversity1stSemester: u1,
              assistUniversity2ndSemester: u2,
            }
          }, { new: false });
        } catch (e) {
          console.warn('Assist migration update failed for', doc._id, e);
        }
      }

      return {
        ...doc,
        assistPrimary1stTerm: a1,
        assistPrimary2ndTerm: a2,
        assistPrimary3rdTerm: a3,
        assistSecondary1stTerm: s1,
        assistSecondary2ndTerm: s2,
        assistSecondary3rdTerm: s3,
        assistUniversity1stSemester: u1,
        assistUniversity2ndSemester: u2,
      };
    }));
    return NextResponse.json({ success: true, data: mapped });
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
      
      // Helper: detect if any assist increased
      function anyAssistIncreased(existing: any, incoming: any) {
        const keys = [
          'assistPrimary1stTerm','assistPrimary2ndTerm','assistPrimary3rdTerm',
          'assistSecondary1stTerm','assistSecondary2ndTerm','assistSecondary3rdTerm',
          'assistUniversity1stSemester','assistUniversity2ndSemester'
        ];
        return keys.some((k) => {
          const prev = parseFloat(existing?.[k] || '0') || 0;
          const next = parseFloat(incoming?.[k] || '0') || 0;
          return next > prev;
        });
      }
      
      // If we have a MongoDB _id, validate it first and then update
      if (_id) {
        if (isValidObjectId(_id)) {
          try {
            const existing = await Bill.findById(_id);
            const updateData: any = { ...billData };
            const prevPaid = parseFloat(existing?.amtPaid || '0') || 0;
            const nextPaid = parseFloat(billData?.amtPaid || '0') || 0;
            if ((nextPaid > 0 && nextPaid !== prevPaid) || anyAssistIncreased(existing, billData)) {
              updateData.paymentDate = new Date();
            }
            const updatedBill = await Bill.findByIdAndUpdate(
              _id,
              { $set: updateData },
              { new: true, runValidators: true }
            );
            if (updatedBill) {
              return updatedBill;
            }
          } catch (updateError) {
            console.error('Error updating bill with ObjectId:', _id, updateError);
          }
        }
      }
      
      // Check for existing bill with same details
      const existingBill = await Bill.findOne({
        name: bill.name,
        school: bill.school,
        academicYear: bill.academicYear,
      });

      if (existingBill) {
        const updateData: any = { ...billData };
        const prevPaid = parseFloat(existingBill.amtPaid || '0') || 0;
        const nextPaid = parseFloat(billData?.amtPaid || '0') || 0;
        if ((nextPaid > 0 && nextPaid !== prevPaid) || anyAssistIncreased(existingBill, billData)) {
          updateData.paymentDate = new Date();
        }
        const updatedBill = await Bill.findByIdAndUpdate(
          existingBill._id,
          { $set: updateData },
          { new: true, runValidators: true }
        );
        return updatedBill;
      } else {
        const newSn = String(Number(lastSn) + index + 1).padStart(3, '0');
        const createData: any = {
          ...billData,
          sn: newSn
        };
        const nextPaid = parseFloat(billData?.amtPaid || '0') || 0;
        if (nextPaid > 0 || anyAssistIncreased({}, billData)) {
          createData.paymentDate = new Date();
        }
        const newBill = await Bill.create(createData);
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