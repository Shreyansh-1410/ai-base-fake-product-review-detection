import uvicorn
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"\n=======================================================")
    print(f"[*] ReviewGuard AI is live on: http://localhost:{port}")
    print(f"    Network access:            http://127.0.0.1:{port}")
    print(f"=======================================================\n")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )

