import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { Appointment } from '../../models/Appointment';
import { Person } from '../../models/Person';
import { Enrollment } from '../../models/Enrollment';
import mongoose from 'mongoose';

// Mock Data for Public Endpoints (Usually fetched from a Services/Courses DB collection)
const MOCK_SERVICES = [
  { id: '1', name: 'Premium Haircut', durationMinutes: 45, price: 45.00, category: 'Hair' },
  { id: '2', name: 'Balayage Color', durationMinutes: 120, price: 150.00, category: 'Hair' },
  { id: '3', name: 'Bridal Makeup', durationMinutes: 90, price: 200.00, category: 'Makeup' },
  { id: '4', name: 'Gel Manicure', durationMinutes: 45, price: 40.00, category: 'Nails' },
];

const MOCK_COURSES = [
  { id: 'c1', name: 'Advanced Bridal Makeup Masterclass', durationWeeks: 4, fee: 800.00 },
  { id: 'c2', name: 'Hair Color Specialist Certification', durationWeeks: 6, fee: 1200.00 },
];

/**
 * Get available services for public booking
 */
export const getServices = async (req: Request, res: Response) => {
  try {
    sendSuccess(res, MOCK_SERVICES, 'Services fetched successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to fetch services');
  }
};

/**
 * Get available courses for academy enrollment
 */
export const getCourses = async (req: Request, res: Response) => {
  try {
    sendSuccess(res, MOCK_COURSES, 'Courses fetched successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to fetch courses');
  }
};

/**
 * Handle a public appointment booking submission
 */
export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, serviceId, date, time } = req.body;
    
    // Default to the first tenant/branch for this MVP, or accept it from a public config
    const tenantId = new mongoose.Types.ObjectId("60d5ec49f1b2c8a14c3e8e2b"); 
    const branchId = new mongoose.Types.ObjectId("60d5ec49f1b2c8a14c3e8e2c");

    // 1. Create or find the Person (Client)
    let person = await Person.findOne({ phone, type: 'client' });
    if (!person) {
      person = await Person.create({
        tenantId,
        branchId,
        type: 'client',
        firstName,
        lastName,
        phone,
        email,
      });
    }

    // 2. Create the Appointment (Status: Pending)
    const serviceName = MOCK_SERVICES.find(s => s.id === serviceId)?.name || 'Unknown Service';
    const appointmentDate = new Date(`${date}T${time}:00`);
    
    // Add 1 hour duration by default if not strictly calculated
    const appointmentEnd = new Date(appointmentDate.getTime() + 60 * 60000); 

    const appointment = await Appointment.create({
      tenantId,
      branchId,
      clientPersonId: person._id,
      services: [{ name: serviceName, durationMinutes: 60 }],
      startTime: appointmentDate,
      endTime: appointmentEnd,
      status: 'pending',
      notes: 'Booked via Public Booking Portal'
    });

    sendSuccess(res, appointment, 'Appointment booked successfully', 201);
  } catch (error: any) {
    console.error("Public Booking Error:", error);
    sendError(res, 500, 'Failed to book appointment');
  }
};

/**
 * Handle a public academy enrollment submission
 */
export const enrollAcademy = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, courseId } = req.body;
    
    const tenantId = new mongoose.Types.ObjectId("60d5ec49f1b2c8a14c3e8e2b"); 
    const branchId = new mongoose.Types.ObjectId("60d5ec49f1b2c8a14c3e8e2c");

    // 1. Create or find the Person (Student)
    let person = await Person.findOne({ phone, type: 'student' });
    if (!person) {
      person = await Person.create({
        tenantId,
        branchId,
        type: 'student',
        firstName,
        lastName,
        phone,
        email,
      });
    }

    // 2. Create the Enrollment (Status: Pending)
    const courseName = MOCK_COURSES.find(c => c.id === courseId)?.name || 'Unknown Course';

    const enrollment = await Enrollment.create({
      tenantId,
      branchId,
      studentPersonId: person._id,
      courseId: new mongoose.Types.ObjectId(), // Mock course ID reference
      enrollmentDate: new Date(),
      status: 'pending',
      totalFee: 0,
      paidAmount: 0
    });

    sendSuccess(res, enrollment, 'Enrollment submitted successfully', 201);
  } catch (error: any) {
    console.error("Public Enrollment Error:", error);
    sendError(res, 500, 'Failed to submit enrollment');
  }
};
