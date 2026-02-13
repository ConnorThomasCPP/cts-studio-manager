#!/usr/bin/env python3
import serial
import sys

def test_printer():
    print("Opening /dev/cu.P21...")
    ser = serial.Serial('/dev/cu.P21', baudrate=115200, timeout=2)
    
    print("Sending SELFTEST command...")
    ser.write(b'SELFTEST\r\n')
    
    print("✓ Command sent! Check if printer prints a test page.")
    ser.close()

test_printer()
