import fitz  # PyMuPDF
import os

pdf_path = r"C:\Users\ayeda\Desktop\Reading stratiges 2026 محلول.pdf"
output_dir = r"C:\Users\ayeda\Desktop\GrammarStrategies\public\uploads\charts"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

doc = fitz.open(pdf_path)

# Extract images from pages 4 to 8 (0-indexed: 3 to 7)
pages_to_extract = [3, 4, 5, 6, 7]
img_count = 1

for page_idx in pages_to_extract:
    page = doc.load_page(page_idx)
    image_list = page.get_images(full=True)
    
    # We expect each page to have some images (the charts)
    for img_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Save image
        image_filename = f"chart_{page_idx + 1}_{img_index}.{image_ext}"
        image_path = os.path.join(output_dir, image_filename)
        
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        print(f"Extracted: {image_filename}")
        img_count += 1

doc.close()
print(f"Successfully extracted {img_count - 1} images.")
