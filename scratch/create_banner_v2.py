from PIL import Image, ImageDraw, ImageFont
import os

# Define paths
banner_source_path = "/Users/haak78/.gemini/antigravity/brain/dde81387-e95c-4c11-8421-dae1be7ba669/media__1779375365594.jpg"
hk_logo_path = "/Users/haak78/Library/CloudStorage/GoogleDrive-tomas.hajek.photographer@gmail.com/Můj disk/Hájek a kavka školí.png"

# Outputs
local_output = "/Users/haak78/.gemini/antigravity/scratch/linkedin_banner_new.png"
external_output_dir = "/Volumes/LaCie 2025/PROJEKTY VAJB/Organiazce Tomáš Hájek/01_Hajek_Kavka"
external_output = os.path.join(external_output_dir, "linkedin_banner_new.png")

# Colors
BRAND_CYAN = (0, 151, 178) # #0097b2

# Initialize canvas
canvas_w, canvas_h = 1584, 396
canvas = Image.new("RGB", (canvas_w, canvas_h), "white")
draw = ImageDraw.Draw(canvas)

# Divide into 3 equal columns: width = 528
col_w = 528
center_col1 = col_w // 2        # 264
center_col2 = col_w + col_w // 2 # 792
center_col3 = 2 * col_w + col_w // 2 # 1320

# 1. COLUMN 1: Prototýpci (centered at 264)
img_source = Image.open(banner_source_path)
# Crop region: x = 95 to 330, y = 0 to 225
proto_crop = img_source.crop((95, 0, 330, 225))
h_proto_target = 240
w_proto_target = int(proto_crop.width * (h_proto_target / proto_crop.height))
proto_resized = proto_crop.resize((w_proto_target, h_proto_target), Image.Resampling.LANCZOS)

x_proto = center_col1 - w_proto_target // 2
y_proto = (canvas_h - h_proto_target) // 2 # (396 - 240) // 2 = 78
canvas.paste(proto_resized, (x_proto, y_proto))

# 2. COLUMN 2: Hájek & Kavka (centered at 792)
hk_img = Image.open(hk_logo_path)
w_hk_target = 480
h_hk_target = 120
hk_resized = hk_img.resize((w_hk_target, h_hk_target), Image.Resampling.LANCZOS)

# Center the logo + text block vertically
h_hk_text_block = h_hk_target + 15 + 26 # 120 + 15 + 26 = 161
y_hk_block_start = (canvas_h - h_hk_text_block) // 2 # (396 - 161) // 2 = 117

x_hk = center_col2 - w_hk_target // 2
canvas.paste(hk_resized, (x_hk, y_hk_block_start))

# Website URL text
text = "www.hajek-kavka.cz"
font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
font_size = 26
if os.path.exists(font_path):
    font = ImageFont.truetype(font_path, font_size)
else:
    font = ImageFont.load_default()

# Centering text
text_bbox = draw.textbbox((0, 0), text, font=font)
text_w = text_bbox[2] - text_bbox[0]
x_text = center_col2 - text_w // 2
y_text = y_hk_block_start + h_hk_target + 15
draw.text((x_text, y_text), text, fill=BRAND_CYAN, font=font)

# 3. COLUMN 3: LEGO Education (centered at 1320)
# Yellow banner crop
yellow_crop = img_source.crop((342, 99, 1024, 221))
w_lego_block = 480
h_yellow_target = int(yellow_crop.height * (w_lego_block / yellow_crop.width)) # 122 * 480 / 682 = 85.8 -> 86

# LEGO logo crop
lego_logo_crop = img_source.crop((579, 15, 798, 79))
# We scale the logo to have the same width as the yellow banner (480)
h_lego_logo_target = int(lego_logo_crop.height * (w_lego_block / lego_logo_crop.width)) # 64 * 480 / 219 = 140

yellow_resized = yellow_crop.resize((w_lego_block, h_yellow_target), Image.Resampling.LANCZOS)
lego_logo_resized = lego_logo_crop.resize((w_lego_block, h_lego_logo_target), Image.Resampling.LANCZOS)

# Combined LEGO block height
lego_block_gap = 15
h_lego_block = h_lego_logo_target + lego_block_gap + h_yellow_target # 140 + 15 + 86 = 241
y_lego_block_start = (canvas_h - h_lego_block) // 2 # (396 - 241) // 2 = 77

x_lego = center_col3 - w_lego_block // 2

# Paste components
canvas.paste(lego_logo_resized, (x_lego, y_lego_block_start))
canvas.paste(yellow_resized, (x_lego, y_lego_block_start + h_lego_logo_target + lego_block_gap))

# Save locally
canvas.save(local_output)
print(f"New banner created locally at {local_output} successfully!")

# Save to external disk
if os.path.exists(external_output_dir):
    canvas.save(external_output)
    print(f"New banner successfully copied to external disk at {external_output}!")
else:
    print(f"WARNING: External path {external_output_dir} does not exist!")

print("Dimensions & Alignment Check:")
print(f"  Prototýpci: width={w_proto_target}, height={h_proto_target}, left={x_proto}, top={y_proto}, bottom={y_proto + h_proto_target}")
print(f"  Hájek & Kavka Block: width={w_hk_target}, height={h_hk_text_block}, left={x_hk}, top={y_hk_block_start}, bottom={y_hk_block_start + h_hk_text_block}")
print(f"  LEGO Education Block: width={w_lego_block}, height={h_lego_block}, left={x_lego}, top={y_lego_block_start}, bottom={y_lego_block_start + h_lego_block}")
