-- Supabase schema setup script for Vyawahare Coaching Classes
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    grade VARCHAR(50) NULL,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id),
    parent_name VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    date_of_birth DATE NULL
);

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    teacher_id INTEGER NOT NULL REFERENCES public.users(id),
    schedule TEXT NULL
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.users(id),
    class_id INTEGER NOT NULL REFERENCES public.classes(id),
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    UNIQUE (student_id, class_id, date)
);

-- Test Results table
CREATE TABLE IF NOT EXISTS public.test_results (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    student_id INTEGER NOT NULL REFERENCES public.users(id),
    class_id INTEGER NOT NULL REFERENCES public.classes(id),
    date DATE NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'graded'))
);

-- Installments table
CREATE TABLE IF NOT EXISTS public.installments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('paid', 'pending', 'overdue'))
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    date DATE NOT NULL,
    time VARCHAR(100) NULL,
    target_grades VARCHAR(255) NULL
);

-- Teacher Payments table
CREATE TABLE IF NOT EXISTS public.teacher_payments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES public.users(id),
    amount DECIMAL(10, 2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    description TEXT NULL,
    payment_date DATE NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('paid', 'pending'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_test_results_student_id ON public.test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_class_id ON public.test_results(class_id);
CREATE INDEX IF NOT EXISTS idx_installments_student_id ON public.installments(student_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.installments(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_teacher_id ON public.teacher_payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_month ON public.teacher_payments(month);
CREATE INDEX IF NOT EXISTS idx_teacher_payments_status ON public.teacher_payments(status);

-- Grant permissions (adjust as needed based on your security requirements)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payments ENABLE ROW LEVEL SECURITY;

-- Sample data insertion would go here, but we'll keep the data in the application for now