import os
import sys
import time
import json
import threading
import requests
import subprocess
from pathlib import Path
from datetime import datetime
import tkinter as tk
from tkinter import messagebox
from pystray import Icon, Menu, MenuItem
from PIL import Image

# --- CONFIGURATION ---
BACKEND_UPLOAD_URL = "https://patelyug01234--recall-fastapi-app.modal.run/api/upload-file"
SUPABASE_URL = "https://avkwaxjnydfxlnavhiis.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3dheGpueWRmeGxuYXZoaWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDc5NTAsImV4cCI6MjA5OTQyMzk1MH0.R9G3WD64REk1soBuuolPZXn4IAPs3k20wL_FEjz4rFI"

EMAIL = ""
PASSWORD = ""

# Resolve Windows Screenshots folder path
user_profile = os.environ.get("USERPROFILE")
if not user_profile:
    user_profile = str(Path.home())
SCREENSHOTS_DIR = os.path.join(user_profile, "Pictures", "Screenshots")

# Global application control variables
is_running = True
is_paused = False
watcher_thread = None
icon = None

# Global auth cache
token_cache = {
    "access_token": None,
    "expires_at": 0
}

# --- CONFIG MANAGEMENT ---
def get_config_path():
    return os.path.join(os.path.expanduser("~"), ".recall_sync_config.json")

def load_config():
    global EMAIL, PASSWORD
    config_path = get_config_path()
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                data = json.load(f)
                EMAIL = data.get("email", "")
                PASSWORD = data.get("password", "")
                return True
        except Exception as e:
            print(f"Error loading config: {e}")
    return False

def save_config(email, password):
    config_path = get_config_path()
    try:
        with open(config_path, "w") as f:
            json.dump({"email": email, "password": password}, f)
        print("Config saved successfully.")
    except Exception as e:
        print(f"Failed to save config: {e}")

# --- STARTUP SHORTCUT MANAGEMENT ---
def check_startup_status():
    startup_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
    shortcut_path = os.path.join(startup_dir, "RecallSync.lnk")
    return os.path.exists(shortcut_path)

def toggle_startup(enable):
    startup_dir = os.path.join(os.environ.get("APPDATA", ""), "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
    shortcut_path = os.path.join(startup_dir, "RecallSync.lnk")
    
    if not enable:
        if os.path.exists(shortcut_path):
            try:
                os.remove(shortcut_path)
                print("Removed startup shortcut.")
            except Exception as e:
                print(f"Failed to remove shortcut: {e}")
        return False
        
    try:
        exe_path = sys.executable
        if not exe_path.endswith(".exe") or "python" in os.path.basename(exe_path).lower():
            # If running raw script, target pythonw.exe + script path
            script_path = os.path.abspath(__file__)
            target = "pythonw.exe"
            args = f'"{script_path}"'
        else:
            # If compiled, link directly to binary
            target = exe_path
            args = ""
            
        ps_command = f"""
        $WshShell = New-Object -ComObject WScript.Shell;
        $Shortcut = $WshShell.CreateShortcut('{shortcut_path}');
        $Shortcut.TargetPath = '{target}';
        $Shortcut.Arguments = '{args}';
        $Shortcut.WorkingDirectory = '{os.path.dirname(shortcut_path)}';
        $Shortcut.Save();
        """
        # Prevent terminal console flashing on Windows
        creationflags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        subprocess.run(["powershell", "-Command", ps_command], capture_output=True, check=True, creationflags=creationflags)
        print("Created startup shortcut successfully.")
        return True
    except Exception as e:
        print(f"Failed to create startup shortcut: {e}")
        return False

# --- AUTHENTICATION ---
def get_auth_token():
    now = time.time()
    if token_cache["access_token"] and token_cache["expires_at"] > now + 300:
        return token_cache["access_token"]

    print("Authenticating with Supabase Auth...")
    try:
        url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "email": EMAIL,
            "password": PASSWORD
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        token_cache["access_token"] = data["access_token"]
        token_cache["expires_at"] = now + int(data.get("expires_in", 3600))
        print("Authentication successful!")
        return token_cache["access_token"]
    except Exception as e:
        print(f"Authentication failed: {e}")
        return None

# --- WINDOWS NOTIFICATIONS ---
def trigger_notification(title, message):
    ps_command = f"""
    [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms");
    $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon;
    $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information;
    $objNotifyIcon.BalloonTipIcon = "Info";
    $objNotifyIcon.BalloonTipTitle = "{title}";
    $objNotifyIcon.BalloonTipText = "{message}";
    $objNotifyIcon.Visible = $True;
    $objNotifyIcon.ShowBalloonTip(4000);
    """
    try:
        # Prevent terminal console flashing on Windows
        creationflags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        subprocess.run(["powershell", "-Command", ps_command], capture_output=True, creationflags=creationflags)
    except Exception as e:
        print(f"Failed to show toast notification: {e}")

# --- OPERATIONS ---
def upload_screenshot(file_path):
    print(f"New screenshot detected: {file_path}")
    token = get_auth_token()
    if not token:
        print("Skipping upload due to authentication failure.")
        trigger_notification("Recall AI: Upload Failed", "Could not authenticate your session.")
        return

    print("Uploading to Recall AI backend...")
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        with open(file_path, "rb") as f:
            files = {
                "file": (os.path.basename(file_path), f, "image/png")
            }
            resp = requests.post(BACKEND_UPLOAD_URL, headers=headers, files=files, timeout=30)
            
        if resp.status_code == 200:
            data = resp.json()
            title = data.get("metadata", {}).get("title", "Screenshot")
            print(f"Upload successful! Indexed item: {title}")
            trigger_notification(
                "Recall AI: Screenshot Indexed! 🚀",
                f"Successfully parsed and indexed: {title}"
            )
        else:
            print(f"Upload endpoint failed with status {resp.status_code}: {resp.text}")
            trigger_notification("Recall AI: Upload Error", f"Server responded with error status {resp.status_code}.")
    except Exception as e:
        print(f"Network error during upload: {e}")
        trigger_notification("Recall AI: Upload Error", "Network or server failure occurred.")

def send_heartbeat():
    token = get_auth_token()
    if not token:
        print("Skipping heartbeat: Authentication failed.")
        return
    try:
        url = BACKEND_UPLOAD_URL.replace("/upload-file", "/watcher/heartbeat")
        headers = {
            "Authorization": f"Bearer {token}"
        }
        resp = requests.post(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            print("Heartbeat successfully sent to Recall AI.")
        else:
            print(f"Heartbeat failed with code {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Error sending heartbeat: {e}")

# --- THREADED SCANNER ---
def watcher_thread_func():
    global is_paused, is_running
    print(f"Watching directory: {SCREENSHOTS_DIR}")
    
    if not os.path.exists(SCREENSHOTS_DIR):
        os.makedirs(SCREENSHOTS_DIR)

    existing_files = set(os.listdir(SCREENSHOTS_DIR))
    
    get_auth_token()
    send_heartbeat()
    last_heartbeat = time.time()

    while is_running:
        try:
            now = time.time()
            if now - last_heartbeat > 30:
                send_heartbeat()
                last_heartbeat = now

            if not is_paused:
                current_files = set(os.listdir(SCREENSHOTS_DIR))
                new_files = current_files - existing_files
                
                for file_name in new_files:
                    if file_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                        file_path = os.path.join(SCREENSHOTS_DIR, file_name)
                        time.sleep(0.5)
                        upload_screenshot(file_path)
                        
                existing_files = current_files
            else:
                existing_files = set(os.listdir(SCREENSHOTS_DIR))
                
            time.sleep(1)
        except Exception as e:
            print(f"Watcher loop error: {e}")
            time.sleep(5)

# --- GUI LOGIN ---
def show_login_gui(on_success_callback):
    root = tk.Tk()
    root.title("Recall AI - Agent Sign In")
    root.geometry("380x240")
    root.resizable(False, False)
    root.configure(bg="#F3F4F6")

    # Center window
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width - 380) // 2
    y = (screen_height - 240) // 2
    root.geometry(f"380x240+{x}+{y}")

    # Title label
    header = tk.Label(root, text="Connect to Recall AI", font=("Arial", 14, "bold"), fg="#1E1B4B", bg="#F3F4F6")
    header.pack(pady=15)

    # Email
    email_frame = tk.Frame(root, bg="#F3F4F6")
    email_frame.pack(fill="x", padx=20, pady=5)
    email_label = tk.Label(email_frame, text="Email Address:", font=("Arial", 9, "bold"), fg="#64748B", bg="#F3F4F6")
    email_label.pack(anchor="w")
    email_entry = tk.Entry(email_frame, font=("Arial", 10), width=40)
    email_entry.pack(pady=2)

    # Password
    pass_frame = tk.Frame(root, bg="#F3F4F6")
    pass_frame.pack(fill="x", padx=20, pady=5)
    pass_label = tk.Label(pass_frame, text="Password:", font=("Arial", 9, "bold"), fg="#64748B", bg="#F3F4F6")
    pass_label.pack(anchor="w")
    pass_entry = tk.Entry(pass_frame, font=("Arial", 10), show="*", width=40)
    pass_entry.pack(pady=2)

    def handle_login():
        email = email_entry.get().strip()
        password = pass_entry.get()
        if not email or not password:
            messagebox.showerror("Validation Error", "Please enter both your email and password.")
            return

        global EMAIL, PASSWORD
        old_email, old_pass = EMAIL, PASSWORD
        EMAIL, PASSWORD = email, password
        
        token = get_auth_token()
        if token:
            save_config(email, password)
            root.destroy()
            on_success_callback()
        else:
            EMAIL, PASSWORD = old_email, old_pass
            messagebox.showerror("Authentication Failed", "Invalid email or password. Please try again.")

    login_btn = tk.Button(root, text="Sign In & Sync", font=("Arial", 10, "bold"), bg="#6C63FF", fg="white", activebackground="#4F46E5", activeforeground="white", command=handle_login, width=15)
    login_btn.pack(pady=15)

    root.mainloop()

# --- TRAY MENU CONTROL ---
def load_tray_icon_image():
    base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    icon_path = os.path.join(base_path, "icon.png")
    if os.path.exists(icon_path):
        return Image.open(icon_path)
    return Image.new('RGB', (64, 64), color=(108, 99, 255))

def get_status_label(item):
    return "Status: Paused" if is_paused else "Status: Active & Listening"

def get_pause_label(item):
    return "Resume Syncing" if is_paused else "Pause Syncing"

def get_startup_checked(item):
    return check_startup_status()

def on_toggle_pause(icon, item):
    global is_paused
    is_paused = not is_paused
    status_text = "paused" if is_paused else "active"
    trigger_notification("Recall AI Sync", f"Screenshot syncing is now {status_text}.")
    icon.update_menu()

def on_toggle_startup(icon, item):
    is_enabled = check_startup_status()
    toggle_startup(not is_enabled)
    icon.update_menu()

def on_logout(icon, item):
    global EMAIL, PASSWORD, token_cache
    config_path = get_config_path()
    if os.path.exists(config_path):
        try:
            os.remove(config_path)
        except Exception:
            pass
    EMAIL = ""
    PASSWORD = ""
    token_cache["access_token"] = None
    trigger_notification("Recall AI", "Successfully logged out.")
    icon.stop()

def on_exit(icon, item):
    global is_running
    is_running = False
    icon.stop()

# --- MAIN APP FLOW ---
def main():
    global is_running, icon, watcher_thread
    
    while is_running:
        has_config = load_config()
        token = None
        if has_config:
            token = get_auth_token()
            
        if not has_config or not token:
            logged_in = [False]
            def on_login_success():
                logged_in[0] = True
            
            show_login_gui(on_success_callback=on_login_success)
            
            if not logged_in[0]:
                print("Login cancelled. Exiting.")
                break
        
        global is_paused
        is_paused = False
        
        watcher_thread = threading.Thread(target=watcher_thread_func, daemon=True)
        watcher_thread.start()
        
        icon_image = load_tray_icon_image()
        menu = Menu(
            MenuItem(get_status_label, lambda: None, enabled=False),
            Menu.SEPARATOR,
            MenuItem(get_pause_label, on_toggle_pause),
            MenuItem("Start on PC Boot", on_toggle_startup, checked=get_startup_checked),
            MenuItem("Log Out / Reset Account", on_logout),
            Menu.SEPARATOR,
            MenuItem("Exit", on_exit)
        )
        icon = Icon("RecallSync", icon_image, "Recall AI Sync", menu=menu)
        icon.run()

if __name__ == "__main__":
    main()
