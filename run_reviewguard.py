import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

def main():
    print("=" * 65)
    print("      ReviewGuard – AI-Based Fake Product Review Detector")
    print("=" * 65)
    print(f"[*] Project root directory: {ROOT_DIR}")
    print(f"[*] Starting backend server & React frontend...")

    # Set PYTHONPATH
    env = os.environ.copy()
    current_pythonpath = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = str(BACKEND_DIR) + (os.pathsep + current_pythonpath if current_pythonpath else "")

    port = os.environ.get("PORT", "5000")
    print(f"\n[*] ReviewGuard Web Application is launching at:")
    print(f"    --> http://localhost:{port}")
    print(f"    --> API Docs: http://localhost:{port}/docs\n")
    print("Press Ctrl+C to stop the server.\n")

    cmd = [sys.executable, str(BACKEND_DIR / "run_server.py"), str(port)]
    subprocess.run(cmd, env=env)

if __name__ == "__main__":
    main()
