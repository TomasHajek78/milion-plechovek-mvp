from PIL import Image

# Open screenshot
img = Image.open('/Users/haak78/.gemini/antigravity/brain/c7b3eca0-9ff0-47aa-87d2-cddfbee592fe/.tempmediaStorage/media_c7b3eca0-9ff0-47aa-87d2-cddfbee592fe_1779548688279.jpg')

# Crop the compute area (x from 280 to 420, y from 160 to 280)
cropped = img.crop((280, 160, 420, 280))

# Convert to grayscale and scale up
gray = cropped.convert('L')
zoomed = gray.resize((gray.width * 5, gray.height * 5), Image.Resampling.NEAREST)

# Threshold to binarize
for threshold in [150, 180, 200, 220, 240]:
    binarized = zoomed.point(lambda p: 0 if p < threshold else 255)
    binarized.save(f'/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/06_Side_Projekty/Milion_plechovek/MVP_Aplikace/scratch/compute_bin_{threshold}.png')

print("Compute enhanced images saved.")
