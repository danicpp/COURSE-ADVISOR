import sqlite3
import csv
import io
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('university.db')
    conn.row_factory = sqlite3.Row
    return conn

# --- HELPERS ---
def get_course_type(course_id):
    # Detects Electives based on University of Sargodha codes
    if any(x in course_id for x in ['CSDE', 'ITDC', 'SEDC', 'DSDC', 'AIDC']):
        return 'Elective'
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
        if user['role'] == 'student':
            row = conn.execute('SELECT * FROM StudentProfiles WHERE roll_number = ?', (user['username'],)).fetchone()
            if row: profile = dict(row)
        conn.close()
        return jsonify({"success": True, "role": user['role'], "profile": profile, "username": user['username']})
    conn.close()
    return jsonify({"success": False, "message": "Invalid Credentials"})

# --- 2. ADMIN ENDPOINTS ---
@app.route('/api/admin/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM StudentProfiles').fetchall()
    conn.close()
    return jsonify([dict(s) for s in students])

@app.route('/api/admin/add-student', methods=['POST'])
def add_student():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO Users VALUES (?, ?, ?)', (data['roll_number'], '1234', 'student'))
        conn.execute('INSERT INTO StudentProfiles VALUES (?, ?, ?, ?, ?, ?)', 
                     (data['roll_number'], data['full_name'], data['father_name'], data['gpa'], data['cgpa'], data['current_semester']))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()

@app.route('/api/admin/delete-student', methods=['POST'])
def delete_student():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM StudentProfiles WHERE roll_number = ?', (data['roll_number'],))
        conn.execute('DELETE FROM Users WHERE username = ?', (data['roll_number'],))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()

@app.route('/api/admin/registrations', methods=['GET'])
def get_all_registrations():
    conn = get_db_connection()
    query = """
        SELECT r.roll_number, r.course_id, c.course_name, r.semester_label, r.status 
        FROM Registrations r
        JOIN Courses c ON r.course_id = c.course_id
    """
    regs = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(r) for r in regs])

@app.route('/api/admin/add-course', methods=['POST'])
def add_course():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO Courses (course_id, course_name, credits, difficulty_level) VALUES (?,?,?,?)',
                     (data['id'], data['name'], data['credits'], data['difficulty']))
        conn.execute('INSERT INTO CourseSchedule (course_id, day_of_week, start_time, end_time) VALUES (?,?,?,?)',
                     (data['id'], data['day'], data['start'], data['end']))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()

# --- 3. STUDENT ENDPOINTS ---
@app.route('/api/student/register', methods=['POST'])
def register_courses():
    data = request.json
    conn = get_db_connection()
    try:
        for c_id in data['courses']:
            conn.execute('INSERT INTO Registrations (roll_number, course_id, semester_label, status) VALUES (?, ?, ?, ?)',
                         (data['username'], c_id, data.get('semester_label', 'Current Selection'), 'Registered'))
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        conn.close()

@app.route('/api/courses', methods=['GET'])
def get_courses():
    conn = get_db_connection()
    courses_db = conn.execute('SELECT * FROM Courses').fetchall()
    final_catalog = []
    for course in courses_db:
        c_id = course['course_id']
        prereq_rows = conn.execute('SELECT prereq_id FROM Prerequisites WHERE course_id = ?', (c_id,)).fetchall()
        prereqs = [row['prereq_id'] for row in prereq_rows]
        sched_row = conn.execute('SELECT * FROM CourseSchedule WHERE course_id = ?', (c_id,)).fetchone()
        schedule_data = {"day": sched_row['day_of_week'], "start": sched_row['start_time'], "end": sched_row['end_time']} if sched_row else {}
        
        course_obj = {
            "id": course['course_id'], "name": course['course_name'], 
            "credits": course['credits'], "difficulty": course['difficulty_level'],
            "prereqs": prereqs, "schedule": schedule_data
        }
        final_catalog.append(course_obj)
    conn.close()
    return jsonify(final_catalog)

@app.route('/api/check-conflict', methods=['POST'])
def check_conflict():
    try:
        data = request.json
        new_course = data.get('new_course')
        current_schedule = data.get('current_schedule')
        
        if not new_course.get('schedule') or not new_course['schedule'].get('day'):
            return jsonify({"conflict": False})

        for existing in current_schedule:
            if not existing.get('schedule') or not existing['schedule'].get('day'):
                continue

            if existing['schedule']['day'] == new_course['schedule']['day']:
                start_a = existing['schedule'].get('start') or 0
                end_a = existing['schedule'].get('end') or 0
                start_b = new_course['schedule'].get('start') or 0
                end_b = new_course['schedule'].get('end') or 0

                if start_a < end_b and start_b < end_a:
                    return jsonify({
                        "conflict": True, 
                        "message": f"Time Conflict: {new_course['name']} overlaps with {existing['name']}"
                    })
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
        passed = set(data.get('passed_courses', []))
        username = data.get('username')
        current_schedule = data.get('current_schedule', [])
        for c in current_schedule: passed.add(c['id'])

        conn = get_db_connection()
        student = conn.execute('SELECT current_semester FROM StudentProfiles WHERE roll_number = ?', (username,)).fetchone()
        start_sem = (student['current_semester'] + 1) if student else 1
        
        all_courses = conn.execute('SELECT * FROM Courses').fetchall()
        prereqs_db = conn.execute('SELECT * FROM Prerequisites').fetchall()
        conn.close()

        courses_map = {c['course_id']: dict(c) for c in all_courses}
        adj_list = {c['course_id']: [] for c in all_courses}
        for p in prereqs_db:
            if p['course_id'] in adj_list: adj_list[p['course_id']].append(p['prereq_id'])

        course_weights = {}
        memo = {}
        for c in all_courses:
            cid = c['course_id']
            course_weights[cid] = calculate_dependency_weight(cid, prereqs_db, memo)

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
                candidates.append(course)

            def score_course(c):
                difficulty = c['difficulty_level'] if c.get('difficulty_level') else 3
                is_critical = course_weights[c['course_id']]
                is_elective = 1 if get_course_type(c['course_id']) == 'Elective' else 0
                
                score = 0
                score += is_critical * 15 
                
                if current_sem <= 2: score -= difficulty * 10
                elif current_sem >= 7: score += difficulty * 5
                
                if current_sem >= 5: score += is_elective * 5
                else: score -= is_elective * 5
                return score

            candidates.sort(key=score_course, reverse=True)

            for c in candidates:
                if credits_sum + c['credits'] > 18: continue
                
                ctype = get_course_type(c['course_id'])
                if ctype == 'Elective':
                    if electives_count >= 2: continue
                    electives_count += 1
                
                semester_load.append(c)
                credits_sum += c['credits']

            if current_sem <= 2: explanation.append("Focusing on foundational courses.")
            elif electives_count > 0: explanation.append(f"Selected {electives_count} elective(s).")
            
            critical = [c['course_name'] for c in semester_load if course_weights[c['course_id']] > 2]
            if critical: explanation.append(f"Prioritized '{critical[0]}' for future paths.")

            if not semester_load:
                if not candidates: 
                    current_sem += 1
                    continue
                break

            roadmap.append({
                "semester": current_sem,
                "courses": semester_load,
                "total_credits": credits_sum,
                "reason": " ".join(explanation)
            })
            
            for c in semester_load:
                passed.add(c['course_id'])
                remaining.remove(c['course_id'])
            
            current_sem += 1

        return jsonify(roadmap)

    except Exception as e:
        print(f"AI ERROR: {e}")
        return jsonify([])

if __name__ == '__main__':
    print("✅ Final Backend Running on Port 5000")
    app.run(port=5000, debug=True)