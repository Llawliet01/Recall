import os
import sys
import subprocess
from PIL import Image, ImageDraw

def generate_default_icon(output_path):
    """Generate a clean, professional purple 'R' icon for the Recall AI System Tray App."""
    print("Generating default app icon...")
    # Create a 64x64 RGBA image with purple background
    img = Image.new('RGBA', (64, 64), color=(108, 99, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw a circular background glow
    draw.ellipse([6, 6, 58, 58], fill=(139, 92, 246, 255))
    
    # Draw a clean geometric white 'R' letter
    # Vertical stem
    draw.line([24, 18, 24, 46], fill=(255, 255, 255, 255), width=5)
    # Loop
    draw.arc([24, 18, 44, 32], 270, 90, fill=(255, 255, 255, 255), width=5)
    draw.line([24, 18, 34, 18], fill=(255, 255, 255, 255), width=5)
    draw.line([24, 32, 34, 32], fill=(255, 255, 255, 255), width=5)
    # Diagonal leg
    draw.line([24, 32, 40, 46], fill=(255, 255, 255, 255), width=5)
    
    # Save as PNG
    img.save(output_path, 'PNG')
    print(f"Icon generated successfully at: {output_path}")

def run_build():
    watcher_dir = os.path.dirname(os.path.abspath(__file__))
    icon_path = os.path.join(watcher_dir, "icon.png")
    script_path = os.path.join(watcher_dir, "recall_watcher.py")
    
    # 1. Generate icon if it does not exist
    if not os.path.exists(icon_path):
        generate_default_icon(icon_path)
        
    # 2. Run PyInstaller command
    print("Starting PyInstaller compilation...")
    
    # We call PyInstaller via python -m to avoid PATH lookup errors
    cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--onefile",
        "--noconsole",
        f"--add-data={icon_path};.",
        f"--icon={icon_path}",
        "--clean",
        script_path
    ]
    
    print(f"Running build command: {' '.join(cmd)}")
    try:
        # Run process and pipe output
        result = subprocess.run(cmd, cwd=watcher_dir, capture_output=True, text=True, check=True)
        print("PyInstaller compiled successfully!")
        print(result.stdout)
        
        # Verify executable was created
        exe_path = os.path.join(watcher_dir, "dist", "recall_watcher.exe")
        if os.path.exists(exe_path):
            print(f"\nSUCCESS! Standing executable created at:\n{exe_path}")
        else:
            print("\nWARNING: Build finished but recall_watcher.exe was not found in dist folder.")
            
    except subprocess.CalledProcessError as e:
        print("\nPyInstaller compilation failed!")
        print(f"Error Code: {e.returncode}")
        print("--- STDOUT ---")
        print(e.stdout)
        print("--- STDERR ---")
        print(e.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_build()
