import sqlite3
import random

def init_system():
    print("... 🚀 INITIALIZING FULL SYSTEM (Admin + Registration Features) ...")
    conn = sqlite3.connect("university.db")
    cursor = conn.cursor()

    # 1. CLEANUP & SCHEMA
    cursor.executescript("""
    DROP TABLE IF EXISTS Registrations;
    DROP TABLE IF EXISTS StudentProfiles;
    DROP TABLE IF EXISTS Users;
    DROP TABLE IF EXISTS CourseSchedule;
    DROP TABLE IF EXISTS Prerequisites;
    DROP TABLE IF EXISTS Courses;
    
    CREATE TABLE Users (
        username TEXT PRIMARY KEY,
        password TEXT,
        role TEXT
    );

    CREATE TABLE StudentProfiles (
        roll_number TEXT PRIMARY KEY,
        full_name TEXT,
        father_name TEXT,
        gpa REAL,
        cgpa REAL,
        current_semester INTEGER,
        FOREIGN KEY (roll_number) REFERENCES Users(username)
    );

    CREATE TABLE Courses (
        course_id VARCHAR(20) PRIMARY KEY,
        course_name VARCHAR(100),
        credits INTEGER,
        difficulty_level INTEGER,
        min_semester INTEGER
    );

    CREATE TABLE Prerequisites (
        course_id VARCHAR(20),
        prereq_id VARCHAR(20),
        FOREIGN KEY (course_id) REFERENCES Courses(course_id),
        FOREIGN KEY (prereq_id) REFERENCES Courses(course_id)
    );

    CREATE TABLE CourseSchedule (
        schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id VARCHAR(20),
        day_of_week VARCHAR(3),
        start_time INTEGER,
        end_time INTEGER,
        FOREIGN KEY (course_id) REFERENCES Courses(course_id)
    );

    -- NEW: Stores courses students have officially registered/accepted
    CREATE TABLE Registrations (
        reg_id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT,
        course_id TEXT,
        semester_label TEXT, -- e.g. "Fall 2025" or "AI Plan Sem 5"
        status TEXT, -- 'Registered', 'Planned'
        FOREIGN KEY (roll_number) REFERENCES Users(username)
    );
    """)

    # 2. INSERT COURSES (Same as before)
    all_courses = [
        ('CMPC-5201', 'Programming Fundamentals', 4, 3, 1), ('URCA-5123', 'ICT', 3, 1, 1),
        ('URCQ-5101', 'Discrete Structures', 3, 4, 1), ('URCQ-5102', 'Calculus & Analytical Geometry', 3, 5, 1),
        ('URCE-5118', 'Functional English', 3, 2, 1), ('BUSB-6101', 'Intro to Marketing', 3, 2, 1),
        ('CMPC-5202', 'Object Oriented Programming', 4, 4, 2), ('CMPC-5203', 'Database Systems', 4, 3, 2),
        ('CMPC-5204', 'Digital Logic Design', 3, 4, 2), ('MATH-5101', 'Multivariable Calculus', 3, 5, 2),
        ('MATH-5102', 'Linear Algebra', 3, 4, 2), ('URCQ-5111-I', 'Translation of Holy Quran I', 1, 1, 2),
        ('CMPC-5205', 'Data Structures', 4, 5, 3), ('CMPC-5209', 'Comp Organization & Assembly', 3, 5, 3),
        ('CMPC-5207', 'Artificial Intelligence', 3, 4, 3), ('CMPC-5208', 'Computer Networks', 3, 3, 3),
        ('CMPC-5101', 'Software Engineering', 3, 2, 3), ('MATH-5103', 'Probability & Statistics', 3, 4, 3),
        ('CMPC-5206', 'Information Security', 3, 3, 4), ('CSDC-5101', 'Theory of Automata', 3, 5, 4),
        ('CSDC-5102', 'Adv. Database Mgmt Systems', 3, 4, 4), ('URCI-5105', 'Islamic Studies', 2, 1, 4),
        ('URCW-5201', 'Applied Physics', 3, 3, 4), ('URCQ-5111-II', 'Translation of Holy Quran II', 1, 1, 4),
        ('CMPC-6201', 'Operating Systems', 3, 5, 5), ('CSDC-6201', 'HCI & Computer Graphics', 3, 3, 5),
        ('CSDC-6202', 'Computer Architecture', 3, 4, 5), ('URCA-5101', 'Intro to Management', 2, 2, 5),
        ('CSDC-6203', 'Compiler Construction', 3, 5, 6), ('ITDC-6204', 'Parallel & Dist. Computing', 3, 5, 6),
        ('URCQ-5111-III', 'Translation of Holy Quran III', 1, 1, 6),
        ('CMPC-6702', 'Final Year Project - I', 2, 5, 7), ('CMPC-6101', 'Analysis of Algorithms', 3, 5, 7),
        ('ENGL-6101', 'Technical & Business Writing', 3, 2, 7), ('URCE-5124', 'Entrepreneurship', 2, 2, 7),
        ('CMPC-6703', 'Final Year Project - II', 4, 5, 8), ('URCI-5122', 'Ideology of Pakistan', 2, 1, 8),
        ('URCS-6101', 'Professional Practices', 2, 1, 8), ('URCC-5125', 'Civics & Community Engagement', 2, 1, 8),
        ('URCQ-5111-IV', 'Translation of Holy Quran IV', 1, 1, 8),
        ('ITDC-5201', 'Web Technologies', 3, 3, 5), ('CSDE-6202', 'Mobile App Development', 3, 4, 5),
        ('CSDE-6505', 'Large Language Models', 3, 5, 6), ('CSDE-6501', 'MERN Stack Development', 3, 4, 5),
        ('DSDE-5102', 'Database Admin & Mgmt', 3, 3, 6)
    ]
    cursor.executemany("INSERT INTO Courses VALUES (?,?,?,?,?)", all_courses)

    prereqs = [
        ('CMPC-5202', 'CMPC-5201'), ('CMPC-5205', 'CMPC-5202'), ('CMPC-6201', 'CMPC-5205'),
        ('CSDC-6203', 'CSDC-5101'), ('CMPC-6703', 'CMPC-6702'), ('CMPC-6101', 'CMPC-5205'),
        ('ITDC-5202', 'CMPC-5206'), ('CSDE-6501', 'ITDC-5201'), ('CSDE-6502', 'ITDC-5201'),
        ('DSDE-5102', 'CMPC-5203')
    ]
    cursor.executemany("INSERT INTO Prerequisites VALUES (?,?)", prereqs)

    schedule = [
        ('CMPC-5201', 'Mon', 900, 1030), ('URCA-5123', 'Mon', 1100, 1230),
        ('CMPC-5205', 'Mon', 900, 1030), ('CMPC-6201', 'Tue', 900, 1030),
        ('CMPC-6702', 'Fri', 900, 1200), ('ITDC-5201', 'Fri', 1400, 1530)
    ]
    cursor.executemany("INSERT INTO CourseSchedule (course_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)", schedule)

    # 5. GENERATE STUDENTS (With explicit Freshman for you)
    print("... Generating Students ...")
    users_data = [('admin', 'admin123', 'admin')]
    
    # Explicit Test User
    test_roll = "BSCS51F24R010"
    users_data.append((test_roll, '1234', 'student'))
    students_data = [(test_roll, "Ali Hassan", "Muhammad Hassan", 3.2, 2.9, 3)]

    cursor.executemany("INSERT INTO Users VALUES (?,?,?)", users_data)
    cursor.executemany("INSERT INTO StudentProfiles VALUES (?,?,?,?,?,?)", students_data)

    conn.commit()
    conn.close()
    print("✅ SYSTEM RESET. Login: BSCS51F24R010 / 1234")

if __name__ == "__main__":
    init_system()