from PIL import Image

# Open the screenshot
img = Image.open('/Users/haak78/.gemini/antigravity/brain/c7b3eca0-9ff0-47aa-87d2-cddfbee592fe/.tempmediaStorage/media_c7b3eca0-9ff0-47aa-87d2-cddfbee592fe_1779548688279.jpg')
width, height = img.size
print(f"Image size: {width}x{height}")

# Crop the top left area (usually contains the Project URL in Supabase Dashboard)
# Let's crop from x=0 to x=600 and y=0 to y=200
crop_box = (0, 0, min(800, width), min(300, height))
cropped_img = img.crop(crop_box)
cropped_img.save('/Users/haak78/.gemini/antigravity/scratch/crop.jpg')
print("Cropped image saved successfully.")
