"""
Helper script to push the repository to https://github.com/nscare62-maker/graph.git
using dulwich (no git.exe required).
"""
import sys
import getpass
import dulwich.porcelain as p

REPO_URL = "https://github.com/nscare62-maker/graph.git"

def main():
    print("=" * 60)
    print("Pushing to GitHub:", REPO_URL)
    print("=" * 60)
    
    token = None
    if len(sys.argv) > 1:
        token = sys.argv[1].strip()
    else:
        print("\nTo push to GitHub, a Personal Access Token (PAT) is required.")
        print("Create one at: https://github.com/settings/tokens (classic token with 'repo' scope)")
        token = getpass.getpass("Enter your GitHub Personal Access Token: ").strip()

    if not token:
        print("Error: No token provided.")
        sys.exit(1)

    auth_url = f"https://{token}@github.com/nscare62-maker/graph.git"
    print("\n[+] Staging project files...")
    p.add(".", paths=[
        "data/raw/users.csv",
        "data/raw/accounts.json",
        "data/raw/carts.json",
        "data/raw/orders.json",
        "graph/visualizer.py",
        "server/app.py",
        "server/static/benchmark_results.png",
        "server/static/css/style.css",
        "server/static/index.html",
        "server/static/js/app.js",
        "render.yaml",
        "requirements.txt",
        "Procfile",
        "runtime.txt"
    ])
    
    try:
        p.commit(".", message=b"Deploy graph recommendation system with auth and customer store", author=b"nscare62-maker <nscare62@users.noreply.github.com>")
        print("[+] Committed latest changes.")
    except Exception:
        print("[i] Working tree clean or already committed.")

    print(f"[+] Pushing 'main' branch to {REPO_URL}...")
    try:
        p.push(".", auth_url, "refs/heads/main")
        print("\n" + "=" * 60)
        print("SUCCESS! Successfully pushed to https://github.com/nscare62-maker/graph")
        print("=" * 60)
    except Exception as e:
        print(f"\n[-] Push failed: {e}")
        print("Please verify your GitHub token has 'repo' write permissions.")
        sys.exit(1)

if __name__ == "__main__":
    main()
