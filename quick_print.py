#!/usr/bin/env python3
"""Quick print script for Nelko P21"""
import serial
import sys
from PIL import Image, ImageOps

def load_image(image_path):
    # Load the image
    image = Image.open(image_path)
    
    # Convert to grayscale
    image = ImageOps.grayscale(image)
    
    # Rotate if needed (label is portrait, 96 wide x 284 tall)
    if image.width > image.height:
        image = image.rotate(90, expand=True)
    
    # Resize to printer dimensions (96x284 pixels)
    image = image.resize((96, 284), Image.Resampling.LANCZOS)
    
    # CRITICAL: Invert the image BEFORE converting to 1-bit
    # Thermal printers expect: 1 = black, 0 = white
    # But PIL barcodes have white background (255) and black bars (0)
    # So we need to invert: black becomes white, white becomes black
    image = ImageOps.invert(image)
    
    # Convert to 1-bit (black and white only) with simple threshold
    # After inversion: values > 128 will become black (1), values < 128 will become white (0)
    image = image.point(lambda p: 255 if p > 128 else 0, '1')
    
    # Convert to bytes
    bitdata = image.tobytes()
    
    # Pad to exact size (3408 bytes = 96 * 284 / 8)
    # Use 0x00 for padding (white pixels) instead of 0xFF (black pixels)
    if len(bitdata) < 3408:
        bitdata = bitdata.ljust(3408, b'\x00')
    
    return bitdata

def print_image(device_path, image_path, density=10):
    print(f"Opening {device_path}...")
    ser = serial.Serial(device_path, baudrate=115200, timeout=2)
    
    print("Loading and processing image...")
    bitmap = load_image(image_path)
    
    print(f"Bitmap size: {len(bitmap)} bytes")
    print("Sending print commands...")
    
    # Send TSPL2 commands
    ser.write(b'SIZE 14.0 mm,40.0 mm\r\n')
    ser.write(b'GAP 2 mm,0 mm\r\n')
    ser.write(b'DIRECTION 0\r\n')
    ser.write(f'DENSITY {density}\r\n'.encode())
    ser.write(b'CLS\r\n')
    
    # Send bitmap data
    # BITMAP x,y,width_in_bytes,height,mode,data
    ser.write(b'BITMAP 0,0,12,284,0,')
    ser.write(bitmap)
    ser.write(b'\r\n')
    
    # Print and feed
    ser.write(b'PRINT 1\r\n')
    
    print("✓ Print command sent!")
    ser.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3.11 quick_print.py <image_path> [density]")
        print("  density: 1-15 (default: 10)")
        sys.exit(1)
    
    image_path = sys.argv[1]
    density = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    print_image('/dev/cu.P21', image_path, density)
