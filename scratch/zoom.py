from PIL import Image

# Open screenshot
img = Image.open('/Users/haak78/.gemini/antigravity/brain/c7b3eca0-9ff0-47aa-87d2-cddfbee592fe/.tempmediaStorage/media_c7b3eca0-9ff0-47aa-87d2-cddfbee592fe_1779548688279.jpg')

# Crop the specific region with the URL: "https://idxlyjug..."
# Based on the previous crop, the URL is near the top left. Let's crop x from 10 to 300, y from 30 to 80.
cropped = img.crop((10, 30, 300, 80))

# Scale up by 5x using NEAREST neighbor to preserve raw pixels
zoomed = cropped.resize((cropped.width * 5, cropped.height * 5), Image.Resampling.NEAREST)
zoomed.save('/Users/haak78/.gemini/antigravity/scratch/zoom.jpg')
print("Zoomed image saved.")
