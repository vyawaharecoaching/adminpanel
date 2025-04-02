-- Publication notes table DDL SQL for Supabase
-- The `?select=null` part of the URL seems to be required for some Supabase REST API calls that perform DDL

-- Create the base tables
CREATE TABLE IF NOT EXISTS public.publication_notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    total_stock INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    last_restocked DATE NULL,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.users(id),
    note_id INTEGER NOT NULL REFERENCES public.publication_notes(id),
    date_issued DATE NOT NULL,
    is_returned BOOLEAN NOT NULL DEFAULT false,
    return_date DATE NULL,
    condition VARCHAR(50) NULL CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_publication_notes_subject ON public.publication_notes(subject);
CREATE INDEX IF NOT EXISTS idx_publication_notes_grade ON public.publication_notes(grade);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON public.student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_note_id ON public.student_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_is_returned ON public.student_notes(is_returned);

-- Enable row level security (uncomment if needed)
-- ALTER TABLE public.publication_notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Sample data for testing
INSERT INTO public.publication_notes (title, subject, grade, total_stock, available_stock, low_stock_threshold, last_restocked, description)
VALUES
('Mathematics for 10th Standard', 'Mathematics', '10th', 50, 35, 10, CURRENT_DATE, 'Comprehensive math workbook covering algebra, geometry, and trigonometry'),
('Science Fundamentals Grade 8', 'Science', '8th', 40, 8, 10, CURRENT_DATE, 'Covers basic physics, chemistry and biology concepts'),
('English Grammar & Composition', 'English', '9th', 60, 12, 15, CURRENT_DATE, 'Grammar rules, essay writing and literary analysis'),
('History of Modern India', 'History', '11th', 30, 2, 5, CURRENT_DATE, 'Comprehensive coverage of Indian independence movement');