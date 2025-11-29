import sqlite3
import random
import os

def init_system():
    # --- BRANDING HEADER ---
    print("\n" + "="*60)
    print("   🎓 UNIVERSITY OF SARGODHA - COURSE PATH ADVISOR")
    print("      Developed by Group 15 (Daniyal, Faisal, Maheen)")
    print("="*60 + "\n")

    print("... 🚀 INITIALIZING FULL SYSTEM (With Complete Timetables) ...")
    
    # Ensure consistent data generation
    random.seed(42)
    
    db_path = os.path.join(os.path.dirname(__file__), '..', 'university.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. CLEANUP & SCHEMA
    cursor.executescript("""
    DROP TABLE IF EXISTS PassedCourses;
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

    CREATE TABLE PassedCourses (
        roll_number TEXT,
        course_id VARCHAR(20),
        PRIMARY KEY (roll_number, course_id),
        FOREIGN KEY (roll_number) REFERENCES StudentProfiles(roll_number),
        FOREIGN KEY (course_id) REFERENCES Courses(course_id)
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

    CREATE TABLE Registrations (
        reg_id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT,
        course_id TEXT,
        semester_label TEXT,
        status TEXT,
        FOREIGN KEY (roll_number) REFERENCES Users(username)
    );
    """)

    # 2. INSERT COURSES
    all_courses = [
        # Sem 1
        ('CMPC-5201', 'Programming Fundamentals', 4, 3, 1), ('URCA-5123', 'ICT', 3, 1, 1),
        ('URCQ-5101', 'Discrete Structures', 3, 4, 1), ('URCQ-5102', 'Calculus & Analytical Geometry', 3, 5, 1),
        ('URCE-5118', 'Functional English', 3, 2, 1), ('BUSB-6101', 'Intro to Marketing', 3, 2, 1),
        # Sem 2
        ('CMPC-5202', 'Object Oriented Programming', 4, 4, 2), ('CMPC-5203', 'Database Systems', 4, 3, 2),
        ('CMPC-5204', 'Digital Logic Design', 3, 4, 2), ('MATH-5101', 'Multivariable Calculus', 3, 5, 2),
        ('MATH-5102', 'Linear Algebra', 3, 4, 2), ('URCQ-5111-I', 'Translation of Holy Quran I', 1, 1, 2),
        # Sem 3
        ('CMPC-5205', 'Data Structures', 4, 5, 3), ('CMPC-5209', 'Comp Organization & Assembly', 3, 5, 3),
        ('CMPC-5207', 'Artificial Intelligence', 3, 4, 3), ('CMPC-5208', 'Computer Networks', 3, 3, 3),
        ('CMPC-5101', 'Software Engineering', 3, 2, 3), ('MATH-5103', 'Probability & Statistics', 3, 4, 3),
        # Sem 4
        ('CMPC-5206', 'Information Security', 3, 3, 4), ('CSDC-5101', 'Theory of Automata', 3, 5, 4),
        ('CSDC-5102', 'Adv. Database Mgmt Systems', 3, 4, 4), ('URCI-5105', 'Islamic Studies', 2, 1, 4),
        ('URCW-5201', 'Applied Physics', 3, 3, 4), ('URCQ-5111-II', 'Translation of Holy Quran II', 1, 1, 4),
        # Sem 5
        ('CMPC-6201', 'Operating Systems', 3, 5, 5), ('CSDC-6201', 'HCI & Computer Graphics', 3, 3, 5),
        ('CSDC-6202', 'Computer Architecture', 3, 4, 5), ('URCA-5101', 'Intro to Management', 2, 2, 5),
        # Sem 6
        ('CSDC-6203', 'Compiler Construction', 3, 5, 6), ('ITDC-6204', 'Parallel & Dist. Computing', 3, 5, 6),
        ('URCQ-5111-III', 'Translation of Holy Quran III', 1, 1, 6),
        # Sem 7
        ('CMPC-6702', 'Final Year Project - I', 2, 5, 7), ('CMPC-6101', 'Analysis of Algorithms', 3, 5, 7),
        ('ENGL-6101', 'Technical & Business Writing', 3, 2, 7), ('URCE-5124', 'Entrepreneurship', 2, 2, 7),
        # Sem 8
        ('CMPC-6703', 'Final Year Project - II', 4, 5, 8), ('URCI-5122', 'Ideology of Pakistan', 2, 1, 8),
        ('URCS-6101', 'Professional Practices', 2, 1, 8), ('URCC-5125', 'Civics & Community Engagement', 2, 1, 8),
        ('URCQ-5111-IV', 'Translation of Holy Quran IV', 1, 1, 8),
        # Electives
        ('ITDC-5201', 'Web Technologies', 3, 3, 5), ('CSDE-6202', 'Mobile App Development', 3, 4, 5),
        ('CSDE-6505', 'Large Language Models', 3, 5, 6), ('CSDE-6501', 'MERN Stack Development', 3, 4, 5),
        ('DSDE-5102', 'Database Admin & Mgmt', 3, 3, 6)
    ]
    cursor.executemany("INSERT INTO Courses VALUES (?,?,?,?,?)", all_courses)

    # 3. INSERT PREREQUISITES
    prereqs = [
        ('CMPC-5202', 'CMPC-5201'), ('CMPC-5205', 'CMPC-5202'), ('CMPC-6201', 'CMPC-5205'),
        ('CSDC-6203', 'CSDC-5101'), ('CMPC-6703', 'CMPC-6702'), ('CMPC-6101', 'CMPC-5205'),
        ('ITDC-5202', 'CMPC-5206'), ('CSDE-6501', 'ITDC-5201'), ('CSDE-6502', 'ITDC-5201'),
        ('DSDE-5102', 'CMPC-5203')
    ]
    cursor.executemany("INSERT INTO Prerequisites VALUES (?,?)", prereqs)

    # 4. INSERT SCHEDULE (Multi-Slot Logic)
    print("... 🗓️  Generating Multi-Day Time Slots ...")
    schedule_data = []
    
    # Base hours for each semester batch
    base_hours = {1: 800, 3: 800, 5: 800, 7: 800, 
                  2: 1200, 4: 1200, 6: 1200, 8: 1200}
    
    current_hour_offset = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0}

    for course in all_courses:
        cid, name, credits, diff, min_sem = course
        
        sem_key = min_sem if min_sem else 7
        if sem_key > 8: sem_key = 8

        start = base_hours[sem_key] + (current_hour_offset[sem_key] * 100)
        if start >= 1600: start = base_hours[sem_key] # Reset if too late
        
        # Logic: Split credits into 1-hour blocks
        days = []
        if credits == 4: days = ['Mon', 'Tue', 'Wed', 'Thu']
        elif credits == 3: days = ['Mon', 'Wed', 'Fri']
        elif credits == 2: days = ['Tue', 'Thu']
        else: days = ['Fri']

        for day in days:
            schedule_data.append((cid, day, start, start + 100))
        
        current_hour_offset[sem_key] += 1

    cursor.executemany("INSERT INTO CourseSchedule (course_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)", schedule_data)

    # 5. GENERATE STUDENTS
    print("... 👥 Generating Students ...")
    users_data = [('admin', 'admin123', 'admin')]
    students_data = []
    
    first_names = ["Ali", "Ahmed", "Sara", "Zara", "Bilal", "Hina", "Omar"]
    last_names = ["Khan", "Malik", "Raja", "Bhatti", "Sheikh", "Cheema"]

    for semester in range(1, 10):
        batch_year = 25 - ((semester - 1) // 2)
        session_char = 'F' if semester % 2 != 0 else 'S'
        batch_code = f"{session_char}{batch_year}"

        for i in range(1, 6):
            roll_no = f"BSCS51{batch_code}R{i:03d}"
            fname = f"{random.choice(first_names)} {random.choice(last_names)}"
            father = f"{random.choice(first_names)} {random.choice(last_names)}"
            gpa = round(random.uniform(2.0, 4.0), 2)
            
            users_data.append((roll_no, '1234', 'student'))
            students_data.append((roll_no, fname, father, gpa, gpa, semester))

    # Explicit Test User
    test_roll = "BSCS51F24R010"
    users_data.append((test_roll, '1234', 'student'))
    students_data.append((test_roll, "Ali Hassan", "Muhammad Hassan", 3.2, 2.9, 3))

    cursor.executemany("INSERT INTO Users VALUES (?,?,?)", users_data)
    cursor.executemany("INSERT INTO StudentProfiles VALUES (?,?,?,?,?,?)", students_data)

    # 6. POPULATE PASSED COURSES
    print("... 🎓 Populating Passed Courses based on Semester ...")
    passed_courses_data = []
    all_courses_list = cursor.execute("SELECT course_id, min_semester FROM Courses").fetchall()
    all_students_list = cursor.execute("SELECT roll_number, current_semester FROM StudentProfiles").fetchall()
    for roll_number, current_semester in all_students_list:
        for course_id, min_semester in all_courses_list:
            if min_semester < current_semester:
                passed_courses_data.append((roll_number, course_id))
    cursor.executemany("INSERT INTO PassedCourses VALUES (?,?)", passed_courses_data)

    conn.commit()
    conn.close()
    print("\n" + "-"*60)
    print("✅ SUCCESS! Database Rebuilt.")
    print(f"   - Test Student Login: {test_roll} / 1234")
    print(f"   - Admin Login:        admin / admin123")
    print("-" * 60 + "\n")

if __name__ == "__main__":
    init_system()