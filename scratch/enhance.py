from PIL import Image, ImageOps, ImageEnhance

# Open screenshot
img = Image.open('/Users/haak78/.gemini/antigravity/brain/c7b3eca0-9ff0-47aa-87d2-cddfbee592fe/.tempmediaStorage/media_c7b3eca0-9ff0-47aa-87d2-cddfbee592fe_1779548688279.jpg')

# Crop the URL (refined coordinates: x from 15 to 250, y from 35 to 55)
cropped = img.crop((15, 33, 240, 53))

# Convert to grayscale
gray = cropped.convert('L')

# Scale up by 10x using nearest-neighbor
zoomed = gray.resize((gray.width * 10, gray.height * 10), Image.Resampling.NEAREST)

# Try different thresholds to find the best contrast for reading the text
for threshold in [150, 180, 200, 220, 240]:
    binarized = zoomed.point(lambda p: 0 if p < threshold else 255) # inverted if needed, wait, background is white (255) and text is dark (lower than 255)
    # Let's save it
    binarized.save(f'/Users/haak78/.gemini/antigravity/scratch/enhanced_bin_{threshold}.png')
print("Enhanced images saved.")
