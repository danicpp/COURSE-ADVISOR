import subprocess
import time
import platform
import os
import sys

def start_project():
    system = platform.system()
    
    print("=================================================")
    print("   🎓 COURSEPATH ADVISOR (Group 15) - LAUNCHER")
    print("=================================================")

    db_path = 'university.db'
    
    # 1. Initialize Database if it doesn't exist or if --reinit-db is passed
    if not os.path.exists(db_path) or "--reinit-db" in sys.argv:
        if "--reinit-db" in sys.argv:
            print("\n[Step 1/3] Force re-initializing database...")
        else:
            print("\n[Step 1/3] Database not found. Initializing...")
        
        try:
            # Using sys.executable ensures we use the same python interpreter
            subprocess.check_call([sys.executable, os.path.join("backend", "init_system.py")])
            print("✅ Database Initialized Successfully.")
        except subprocess.CalledProcessError as e:
            print(f"❌ Database Initialization Failed: {e}")
            return
    else:
        print("\n[Step 1/3] Database already exists. Skipping initialization.")
        print("   (To re-initialize, run: python run.py --reinit-db)")

    print("\n[Step 2/3] Launching Backend Server...")
    if system == "Windows":
        # Windows: Start in new CMD window
        subprocess.Popen('start "Flask Backend" cmd /k "cd backend && py app.py"', shell=True)
    else:
        # Linux/Mac: Start in background
        subprocess.Popen("cd backend && python3 app.py", shell=True)
    
    print("   Waiting for backend to warm up...")
    time.sleep(5) 

    print("\n[Step 3/3] Launching Frontend Dashboard...")
    if system == "Windows":
        subprocess.Popen('start "React Frontend" cmd /k "npm start"', shell=True)
    else:
        subprocess.Popen("npm start", shell=True)

    print("\n=================================================")
    print("✅ SYSTEM IS LIVE!")
    print("   - Frontend: http://localhost:3000")
    print("   - Backend:  http://localhost:5000")
    print("=================================================")
    print("\nDon't close this window immediately.")

if __name__ == "__main__":
    start_project()