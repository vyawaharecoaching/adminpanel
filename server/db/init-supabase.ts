import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

/**
 * Initialize Supabase tables using the SQL schema file
 */
export async function initSupabaseTables() {
  try {
    console.log('[supabase] Initializing Supabase tables...');
    
    // Read the schema file
    const schemaFilePath = path.join(process.cwd(), 'supabase-schema.sql');
    
    if (!fs.existsSync(schemaFilePath)) {
      console.error('[supabase] Schema file not found:', schemaFilePath);
      return false;
    }
    
    const schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Execute the SQL schema
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      console.error('[supabase] Error initializing tables:', error);
      return false;
    }
    
    console.log('[supabase] Tables initialized successfully');
    return true;
  } catch (error) {
    console.error('[supabase] Error initializing Supabase tables:', error);
    return false;
  }
}

/**
 * Check if the Supabase tables exist
 */
export async function checkSupabaseTables() {
  try {
    console.log('[supabase] Checking if Supabase tables exist...');
    
    // Check if users table exists by trying to query it
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('[supabase] Error checking tables:', error);
      return false;
    }
    
    console.log('[supabase] Tables exist and are accessible');
    return true;
  } catch (error) {
    console.error('[supabase] Error checking Supabase tables:', error);
    return false;
  }
}

/**
 * Initialize Supabase with sample data
 */
export async function addSampleDataToSupabase() {
  try {
    // Check if there are any users first
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[supabase] Error checking users table:', error);
      return false;
    }
    
    // If there are already users, don't add sample data
    if (count && count > 0) {
      console.log('[supabase] Database already has data, skipping sample data addition');
      return true;
    }
    
    console.log('[supabase] Adding sample data...');
    
    // Add admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .insert([{
        username: 'admin',
        password: '$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe', // "admin123"
        full_name: 'Administrator',
        email: 'admin@vyawahare.edu',
        role: 'admin'
      }])
      .select()
      .single();
    
    if (adminError) {
      console.error('[supabase] Error adding admin user:', adminError);
      return false;
    }
    
    // Add teacher user
    const { data: teacherUser, error: teacherError } = await supabase
      .from('users')
      .insert([{
        username: 'teacher1',
        password: '$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe', // "admin123"
        full_name: 'Rahul Vyawahare',
        email: 'rahul@vyawahare.edu',
        role: 'teacher'
      }])
      .select()
      .single();
    
    if (teacherError) {
      console.error('[supabase] Error adding teacher user:', teacherError);
      return false;
    }
    
    // Add sample classes
    const { data: class8, error: class8Error } = await supabase
      .from('classes')
      .insert([{
        name: 'Math Class 8th',
        grade: '8th',
        teacher_id: teacherUser.id,
        schedule: 'Monday, Wednesday, Friday 9:00 AM - 10:30 AM'
      }])
      .select()
      .single();
    
    if (class8Error) {
      console.error('[supabase] Error adding class 8:', class8Error);
      return false;
    }
    
    const { data: class10, error: class10Error } = await supabase
      .from('classes')
      .insert([{
        name: 'Science Class 10th',
        grade: '10th',
        teacher_id: teacherUser.id,
        schedule: 'Tuesday, Thursday 10:30 AM - 12:00 PM'
      }])
      .select()
      .single();
    
    if (class10Error) {
      console.error('[supabase] Error adding class 10:', class10Error);
      return false;
    }
    
    // Add sample student users
    const { data: student1User, error: student1UserError } = await supabase
      .from('users')
      .insert([{
        username: 'student1',
        password: '$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe', // "admin123"
        full_name: 'Raj Patel',
        email: 'raj@example.com',
        role: 'student',
        grade: '8th'
      }])
      .select()
      .single();
    
    if (student1UserError) {
      console.error('[supabase] Error adding student 1 user:', student1UserError);
      return false;
    }
    
    // Add student profile
    const { error: student1Error } = await supabase
      .from('students')
      .insert([{
        user_id: student1User.id,
        parent_name: 'Suresh Patel',
        phone: '9876543210',
        address: '123 Main Street, Pune',
        date_of_birth: '2010-05-15'
      }]);
    
    if (student1Error) {
      console.error('[supabase] Error adding student 1 profile:', student1Error);
      return false;
    }
    
    const { data: student2User, error: student2UserError } = await supabase
      .from('users')
      .insert([{
        username: 'student2',
        password: '$2b$10$2pYXCwANWCW5gF3WZsv1ZOIUbio2emmpJlOHJvSfuW5iXSO.Z2aKe', // "admin123"
        full_name: 'Priya Sharma',
        email: 'priya@example.com',
        role: 'student',
        grade: '10th'
      }])
      .select()
      .single();
    
    if (student2UserError) {
      console.error('[supabase] Error adding student 2 user:', student2UserError);
      return false;
    }
    
    // Add student profile
    const { error: student2Error } = await supabase
      .from('students')
      .insert([{
        user_id: student2User.id,
        parent_name: 'Anita Sharma',
        phone: '9876543211',
        address: '456 Park Avenue, Pune',
        date_of_birth: '2008-07-20'
      }]);
    
    if (student2Error) {
      console.error('[supabase] Error adding student 2 profile:', student2Error);
      return false;
    }
    
    // Add sample attendance records
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];
    
    const { error: attendance1Error } = await supabase
      .from('attendance')
      .insert([{
        student_id: student1User.id,
        class_id: class8.id,
        date: yesterdayStr,
        status: 'present'
      }]);
    
    if (attendance1Error) {
      console.error('[supabase] Error adding attendance 1:', attendance1Error);
      return false;
    }
    
    const { error: attendance2Error } = await supabase
      .from('attendance')
      .insert([{
        student_id: student1User.id,
        class_id: class8.id,
        date: lastWeekStr,
        status: 'absent'
      }]);
    
    if (attendance2Error) {
      console.error('[supabase] Error adding attendance 2:', attendance2Error);
      return false;
    }
    
    const { error: attendance3Error } = await supabase
      .from('attendance')
      .insert([{
        student_id: student2User.id,
        class_id: class10.id,
        date: yesterdayStr,
        status: 'present'
      }]);
    
    if (attendance3Error) {
      console.error('[supabase] Error adding attendance 3:', attendance3Error);
      return false;
    }
    
    // Add sample test results
    const { error: test1Error } = await supabase
      .from('test_results')
      .insert([{
        name: 'Midterm Math Exam',
        student_id: student1User.id,
        class_id: class8.id,
        date: lastWeekStr,
        score: 85,
        max_score: 100,
        status: 'graded'
      }]);
    
    if (test1Error) {
      console.error('[supabase] Error adding test result 1:', test1Error);
      return false;
    }
    
    const { error: test2Error } = await supabase
      .from('test_results')
      .insert([{
        name: 'Science Quiz',
        student_id: student2User.id,
        class_id: class10.id,
        date: yesterdayStr,
        score: 75,
        max_score: 100,
        status: 'graded'
      }]);
    
    if (test2Error) {
      console.error('[supabase] Error adding test result 2:', test2Error);
      return false;
    }
    
    // Add sample installments
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { error: installment1Error } = await supabase
      .from('installments')
      .insert([{
        student_id: student1User.id,
        amount: 5000,
        due_date: lastMonthStr,
        payment_date: lastMonthStr,
        status: 'paid'
      }]);
    
    if (installment1Error) {
      console.error('[supabase] Error adding installment 1:', installment1Error);
      return false;
    }
    
    const { error: installment2Error } = await supabase
      .from('installments')
      .insert([{
        student_id: student1User.id,
        amount: 5000,
        due_date: todayStr,
        status: 'pending'
      }]);
    
    if (installment2Error) {
      console.error('[supabase] Error adding installment 2:', installment2Error);
      return false;
    }
    
    const { error: installment3Error } = await supabase
      .from('installments')
      .insert([{
        student_id: student1User.id,
        amount: 5000,
        due_date: nextMonthStr,
        status: 'pending'
      }]);
    
    if (installment3Error) {
      console.error('[supabase] Error adding installment 3:', installment3Error);
      return false;
    }
    
    const { error: installment4Error } = await supabase
      .from('installments')
      .insert([{
        student_id: student2User.id,
        amount: 6000,
        due_date: lastMonthStr,
        status: 'overdue'
      }]);
    
    if (installment4Error) {
      console.error('[supabase] Error adding installment 4:', installment4Error);
      return false;
    }
    
    const { error: installment5Error } = await supabase
      .from('installments')
      .insert([{
        student_id: student2User.id,
        amount: 6000,
        due_date: nextMonthStr,
        status: 'pending'
      }]);
    
    if (installment5Error) {
      console.error('[supabase] Error adding installment 5:', installment5Error);
      return false;
    }
    
    // Add sample events
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    const nextTwoWeeks = new Date();
    nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
    const nextTwoWeeksStr = nextTwoWeeks.toISOString().split('T')[0];
    
    const { error: event1Error } = await supabase
      .from('events')
      .insert([{
        title: 'Parent-Teacher Meeting',
        description: 'Annual meeting to discuss student progress',
        date: nextWeekStr,
        time: '10:00 AM - 2:00 PM',
        target_grades: 'All'
      }]);
    
    if (event1Error) {
      console.error('[supabase] Error adding event 1:', event1Error);
      return false;
    }
    
    const { error: event2Error } = await supabase
      .from('events')
      .insert([{
        title: 'Science Fair',
        description: 'Annual science exhibition for students',
        date: nextTwoWeeksStr,
        time: '9:00 AM - 4:00 PM',
        target_grades: '8th, 9th, 10th'
      }]);
    
    if (event2Error) {
      console.error('[supabase] Error adding event 2:', event2Error);
      return false;
    }
    
    // Add sample teacher payments
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().substring(0, 7); // YYYY-MM format
    
    const { error: payment1Error } = await supabase
      .from('teacher_payments')
      .insert([{
        teacher_id: teacherUser.id,
        amount: 25000,
        month: prevMonthStr,
        description: 'Monthly salary',
        payment_date: lastMonthStr,
        status: 'paid'
      }]);
    
    if (payment1Error) {
      console.error('[supabase] Error adding teacher payment 1:', payment1Error);
      return false;
    }
    
    const { error: payment2Error } = await supabase
      .from('teacher_payments')
      .insert([{
        teacher_id: teacherUser.id,
        amount: 25000,
        month: currentMonth,
        description: 'Monthly salary',
        status: 'pending'
      }]);
    
    if (payment2Error) {
      console.error('[supabase] Error adding teacher payment 2:', payment2Error);
      return false;
    }
    
    console.log('[supabase] Sample data added successfully');
    return true;
  } catch (error) {
    console.error('[supabase] Error adding sample data:', error);
    return false;
  }
}