import sqlite3
import csv
import io
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('../university.db')
    conn.row_factory = sqlite3.Row
    return conn

# --- HELPERS ---
def get_course_type(course_id):
    if any(x in course_id for x in ['CSDE', 'ITDC', 'SEDC', 'DSDC', 'AIDC']): return 'Elective'
    return 'Core'

def calculate_dependency_weight(course_id, prereqs_db, memo={}):
    if course_id in memo: return memo[course_id]
    dependents = [p['course_id'] for p in prereqs_db if p['prereq_id'] == course_id]
    if not dependents: return 0
    max_depth = 0
    for dep in dependents:
        depth = 1 + calculate_dependency_weight(dep, prereqs_db, memo)
        if depth > max_depth: max_depth = depth
    memo[course_id] = max_depth
    return max_depth

# --- 1. AUTH ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM Users WHERE username = ? AND password = ?', 
                        (data['username'], data['password'])).fetchone()
    if user:
        profile = {}
        passed_courses = []
        if user['role'] == 'student':
            row = conn.execute('SELECT * FROM StudentProfiles WHERE roll_number = ?', (user['username'],)).fetchone()
            if row: 
                profile = dict(row)
                current_label = f"Semester {profile['current_semester']}"
                reg_check = conn.execute("SELECT 1 FROM Registrations WHERE roll_number=? AND semester_label LIKE ?", 
                                         (user['username'], f'%{current_label}%')).fetchone()
                profile['is_registered'] = True if reg_check else False
                
                passed_rows = conn.execute('SELECT course_id FROM PassedCourses WHERE roll_number = ?', (user['username'],)).fetchall()
                passed_courses = [r['course_id'] for r in passed_rows]
            else:
                profile = {
                    'roll_number': user['username'],
                    'full_name': user['username'],
                    'is_registered': False,
                    'current_semester': 1,
                    'gpa': 0,
                    'cgpa': 0,
                    'father_name': ''
                }
                passed_courses = []

        conn.close()
        return jsonify({"success": True, "role": user['role'], "profile": profile, "username": user['username'], "passed_courses": passed_courses})
    conn.close()
    return jsonify({"success": False, "message": "Invalid Credentials"})

# --- 2. ADMIN ENDPOINTS ---
@app.route('/api/admin/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM StudentProfiles').fetchall()
    conn.close()
    return jsonify([dict(s) for s in students])

@app.route('/api/admin/registrations', methods=['GET'])
def get_all_registrations():
    conn = get_db_connection()
    query = """
        SELECT DISTINCT r.roll_number, r.course_id, c.course_name, r.semester_label, r.status 
        FROM Registrations r
        JOIN Courses c ON r.course_id = c.course_id
        ORDER BY r.semester_label DESC, r.roll_number
    """
    regs = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(r) for r in regs])

@app.route('/api/admin/registrations/course', methods=['POST'])
def get_registrations_by_course():
    data = request.json
    conn = get_db_connection()
    query = """
        SELECT DISTINCT r.roll_number, sp.full_name, r.semester_label, r.status
        FROM Registrations r
        JOIN StudentProfiles sp ON r.roll_number = sp.roll_number
        WHERE r.course_id = ?
    """
    regs = conn.execute(query, (data['course_id'],)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in regs])

@app.route('/api/admin/add-student', methods=['POST'])
def add_student():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO Users VALUES (?, ?, ?)', (data['roll_number'], '1234', 'student'))
        conn.execute('INSERT INTO StudentProfiles VALUES (?, ?, ?, ?, ?, ?)', 
                     (data['roll_number'], data['full_name'], data['father_name'], data['gpa'], data['cgpa'], data['current_semester']))
        conn.commit(); return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})
    finally: conn.close()

@app.route('/api/admin/delete-student', methods=['POST'])
def delete_student():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM StudentProfiles WHERE roll_number = ?', (data['roll_number'],))
        conn.execute('DELETE FROM Users WHERE username = ?', (data['roll_number'],))
        conn.commit(); return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})
    finally: conn.close()

@app.route('/api/admin/add-course', methods=['POST'])
def add_course():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO Courses VALUES (?,?,?,?,?)', (data['id'], data['name'], data['credits'], data['difficulty'], 1))
        # Basic schedule default
        conn.execute('INSERT INTO CourseSchedule (course_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)', 
                     (data['id'], data['day'], data['start'], data['end']))
        conn.commit(); return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})
    finally: conn.close()

@app.route('/api/admin/update-schedule', methods=['POST'])
def update_schedule():
    data = request.json
    conn = get_db_connection()
    try:
        # For update, we just replace with a single slot for simplicity in Admin UI
        # (Enhancement: Admin UI could support multi-slot editing in future)
        conn.execute('DELETE FROM CourseSchedule WHERE course_id=?', (data['course_id'],))
        conn.execute('INSERT INTO CourseSchedule (course_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)',
                     (data['course_id'], data['day'], data['start'], data['end']))
        conn.commit(); return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})
    finally: conn.close()

# --- 3. STUDENT ENDPOINTS ---
@app.route('/api/student/register', methods=['POST'])
def register_courses():
    data = request.json
    conn = get_db_connection()
    try:
        sem_label = data.get('semester_label', 'Unknown Semester')
        for c_id in data['courses']:
            exists = conn.execute('SELECT 1 FROM Registrations WHERE roll_number=? AND course_id=? AND semester_label=?', 
                                  (data['username'], c_id, sem_label)).fetchone()
            if not exists:
                conn.execute('INSERT INTO Registrations (roll_number, course_id, semester_label, status) VALUES (?, ?, ?, ?)',
                             (data['username'], c_id, sem_label, 'Registered'))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e: return jsonify({"success": False, "message": str(e)})
    finally: conn.close()

# --- 4. GENERAL & AI ---
@app.route('/api/courses', methods=['GET'])
def get_courses():
    conn = get_db_connection()
    courses = conn.execute('SELECT * FROM Courses').fetchall()
    final_catalog = []
    for c in courses:
        c_id = c['course_id']
        
        # === UPDATE: FETCH ALL SCHEDULE ROWS ===
        sched_rows = conn.execute('SELECT * FROM CourseSchedule WHERE course_id=?', (c_id,)).fetchall()
        schedule_list = [{"day": s['day_of_week'], "start": s['start_time'], "end": s['end_time']} for s in sched_rows]
        # =======================================
        
        prereqs = [r['prereq_id'] for r in conn.execute('SELECT prereq_id FROM Prerequisites WHERE course_id=?', (c_id,)).fetchall()]
        
        final_catalog.append({
            "id": c_id, "name": c['course_name'], "credits": c['credits'], 
            "difficulty": c['difficulty_level'], "prereqs": prereqs, "schedule": schedule_list
        })
    conn.close()
    return jsonify(final_catalog)

@app.route('/api/check-conflict', methods=['POST'])
def check_conflict():
    try:
        data = request.json
        new, curr = data.get('new_course'), data.get('current_schedule')
        if not new.get('schedule'): return jsonify({"conflict": False})
        
        for ex in curr:
            if not ex.get('schedule'): continue
            
            # === UPDATE: LOOP THROUGH ALL SLOTS ===
            # Compare every slot of New Course vs Every slot of Existing Course
            for s1 in ex['schedule']:
                for s2 in new['schedule']:
                    if s1['day'] == s2['day']:
                        if s1['start'] < s2['end'] and s2['start'] < s1['end']:
                            return jsonify({"conflict": True, "message": f"Clash with {ex['name']} ({s1['day']} {s1['start']})" })
            # ======================================
            
        return jsonify({"conflict": False})
    except Exception as e:
        return jsonify({"conflict": True, "message": "Server Error"})

@app.route('/api/report/download', methods=['POST'])
def download_report():
    schedule = request.json.get('schedule', [])
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['Course Code', 'Course Name', 'Credits', 'Day', 'Time'])
    for c in schedule:
        time = f"{c['schedule']['start']}-{c['schedule']['end']}" if c.get('schedule') else "TBA"
        cw.writerow([c['id'], c['name'], c['credits'], c['schedule'].get('day', ''), time])
    
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=report.csv"
    output.headers["Content-type"] = "text/csv"
    return output

# --- 4. SMART PATH GENERATOR (The AI Logic) ---
@app.route('/api/generate-path', methods=['POST'])
def generate_path():
    try:
        data = request.json
        username = data.get('username')
        strategy = data.get('strategy', 'balanced')
        current_schedule = data.get('current_schedule', [])
        
        conn = get_db_connection()
        
        passed_courses_rows = conn.execute('SELECT course_id FROM PassedCourses WHERE roll_number = ?', (username,)).fetchall()
        passed = {row['course_id'] for row in passed_courses_rows}
        
        for c in current_schedule: 
            passed.add(c['id'])
        
        student = conn.execute('SELECT current_semester FROM StudentProfiles WHERE roll_number = ?', (username,)).fetchone()
        start_sem = (student['current_semester'] + 1) if student else 1
        all_courses = conn.execute('SELECT * FROM Courses').fetchall()
        prereqs_db = conn.execute('SELECT * FROM Prerequisites').fetchall()
        conn.close()

        courses_map = {c['course_id']: dict(c) for c in all_courses}
        adj_list = {c['course_id']: [] for c in all_courses}
        for p in prereqs_db: 
            if p['course_id'] in adj_list: adj_list[p['course_id']].append(p['prereq_id'])
        
        course_weights = {c['course_id']: calculate_dependency_weight(c['course_id'], prereqs_db, {}) for c in all_courses}
        roadmap = []
        remaining = [c['course_id'] for c in all_courses if c['course_id'] not in passed]
        current_sem = start_sem
        
        while remaining and current_sem <= 8:
            semester_load = []
            credits_sum = 0
            electives_count = 0
            explanation = []
            candidates = []
            for cid in remaining:
                course = courses_map[cid]
                if not all(r in passed for r in adj_list.get(cid, [])): continue
                min_sem = course['min_semester'] if course['min_semester'] else 1
                if current_sem < min_sem: continue
                if course['course_id'] in ['CMPC-6702', 'CMPC-6703']: continue
                candidates.append(course)

            def score_course(c):
                diff = c['difficulty_level'] if c.get('difficulty_level') else 3
                crit = course_weights[c['course_id']]
                is_elec = 1 if get_course_type(c['course_id']) == 'Elective' else 0
                score = crit * 15
                if strategy == 'aggressive': score += diff * 5
                elif strategy == 'relaxed': score -= diff * 20
                else:
                    if current_sem <= 2: score -= diff * 10
                    elif current_sem >= 7: score += diff * 5
                return score

            candidates.sort(key=score_course, reverse=True)
            limit = 14 if strategy == 'relaxed' else 18

            for c in candidates:
                if credits_sum + c['credits'] > limit: continue
                if get_course_type(c['course_id']) == 'Elective':
                    if electives_count >= 2: continue
                    electives_count += 1
                semester_load.append(c)
                credits_sum += c['credits']
            
            if not semester_load:
                if not candidates: current_sem += 1; continue
                break
                
            if current_sem <= 2: explanation.append("Focusing on foundational courses.")
            roadmap.append({"semester": current_sem, "courses": semester_load, "total_credits": credits_sum, "reason": " ".join(explanation)})
            for c in semester_load: passed.add(c['course_id']); remaining.remove(c['course_id'])
            current_sem += 1
            
        return jsonify(roadmap)
    except Exception as e: print(e); return jsonify([])

if __name__ == '__main__':
    print("✅ Final Backend Running on Port 5000")
    app.run(port=5000, debug=True)
