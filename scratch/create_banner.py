from PIL import Image, ImageDraw, ImageFont
import os

# Define paths
banner_source_path = "/Users/haak78/.gemini/antigravity/brain/dde81387-e95c-4c11-8421-dae1be7ba669/media__1779375365594.jpg"
hk_logo_path = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/Hájek a kavka školí.png"
output_path = "/Users/haak78/.gemini/antigravity/scratch/linkedin_banner_new.png"

# Colors
BRAND_CYAN = (0, 151, 178) # #0097b2

# Initialize canvas
canvas_w, canvas_h = 1584, 396
canvas = Image.new("RGB", (canvas_w, canvas_h), "white")
draw = ImageDraw.Draw(canvas)

# 1. Load and crop Prototýpci
img_source = Image.open(banner_source_path)
# Crop region: x = 95 to 335, y = 0 to 225
proto_crop = img_source.crop((95, 0, 335, 225))
h_proto_target = 160
w_proto_target = int(proto_crop.width * (h_proto_target / proto_crop.height))
proto_resized = proto_crop.resize((w_proto_target, h_proto_target), Image.Resampling.LANCZOS)

# 2. Load and crop LEGO Education block
# Crop region: x = 342 to 1024, y = 15 to 221
lego_crop = img_source.crop((342, 15, 1024, 221))
h_lego_target = 160
w_lego_target = int(lego_crop.width * (h_lego_target / lego_crop.height))
lego_resized = lego_crop.resize((w_lego_target, h_lego_target), Image.Resampling.LANCZOS)

# 3. Load Hájek & Kavka logo
hk_img = Image.open(hk_logo_path)
w_hk_target = 480
h_hk_target = 120
hk_resized = hk_img.resize((w_hk_target, h_hk_target), Image.Resampling.LANCZOS)

# Coordinates calculation for centered layout
# Left margin and gaps
margin_left = 100
margin_right = 100

total_width_components = w_proto_target + w_hk_target + w_lego_target
remaining_space = canvas_w - margin_left - margin_right - total_width_components
gap = remaining_space // 2

x_proto = margin_left
x_hk = x_proto + w_proto_target + gap
x_lego = x_hk + w_hk_target + gap

# Vertical centers
y_proto = (canvas_h - h_proto_target) // 2
y_lego = (canvas_h - h_lego_target) // 2
y_hk = (canvas_h - (h_hk_target + 15 + 26)) // 2 # Center the logo + text block

# Paste components
canvas.paste(proto_resized, (x_proto, y_proto))
canvas.paste(hk_resized, (x_hk, y_hk))
canvas.paste(lego_resized, (x_lego, y_lego))

# Draw text "www.hajek-kavka.cz"
text = "www.hajek-kavka.cz"
font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
font_size = 26
if os.path.exists(font_path):
    font = ImageFont.truetype(font_path, font_size)
else:
    font = ImageFont.load_default()

# Get text bounding box for centering
text_bbox = draw.textbbox((0, 0), text, font=font)
text_w = text_bbox[2] - text_bbox[0]
text_h = text_bbox[3] - text_bbox[1]

# Center text horizontally below the HK logo
x_text = x_hk + (w_hk_target - text_w) // 2
y_text = y_hk + h_hk_target + 15 # 15px gap below logo

draw.text((x_text, y_text), text, fill=BRAND_CYAN, font=font)

# Save canvas
canvas.save(output_path)
print(f"New banner created at {output_path} successfully!")
print(f"Positions:")
print(f"  Prototýpci: x={x_proto}, y={y_proto}, size={proto_resized.size}")
print(f"  Hájek & Kavka: x={x_hk}, y={y_hk}, size={hk_resized.size}")
print(f"  LEGO: x={x_lego}, y={y_lego}, size={lego_resized.size}")
print(f"  Website Text: x={x_text}, y={y_text}")
print(f"  Gaps: {gap} px")
