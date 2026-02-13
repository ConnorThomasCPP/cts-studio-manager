#!/bin/bash
# Retry print script with connection handling

IMAGE="${1:-INS-00001-barcode-processed.png}"
MAX_RETRIES=3
RETRY_DELAY=2

echo "=== Nelko P21 Print Script with Retry ==="
echo "Image: $IMAGE"
echo ""
echo "Please ensure the printer is:"
echo "  1. Powered on"
echo "  2. Within range"
echo "  3. Press any button to wake it up"
echo ""
echo "Starting print in 3 seconds..."
sleep 3

for i in $(seq 1 $MAX_RETRIES); do
    echo ""
    echo "Attempt $i of $MAX_RETRIES..."
    
    if /opt/homebrew/bin/python3.11 quick_print.py "$IMAGE"; then
        echo "✓ Print successful!"
        exit 0
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo "✗ Print failed, retrying in ${RETRY_DELAY} seconds..."
            echo "  (Try pressing a button on the printer now)"
            sleep $RETRY_DELAY
        fi
    fi
done

echo ""
echo "✗ Print failed after $MAX_RETRIES attempts"
echo ""
echo "Troubleshooting:"
echo "  1. Check if printer shows in Bluetooth settings"
echo "  2. Try un-pairing and re-pairing the printer"
echo "  3. Restart the printer"
exit 1
