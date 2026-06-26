from PIL import Image

def generate_neutral_lut(filename):
    width = 256
    height = 16
    img = Image.new('RGB', (width, height))
    pixels = img.load()

    for py in range(height):
        for px in range(width):
            b = px // 16
            x = px % 16
            y = py
            
            # 16 values from 0 to 255 (0, 17, 34, ..., 255)
            r = x * 17
            g = y * 17
            blue = b * 17
            
            pixels[px, py] = (r, g, blue)

    img.save(filename)
    print(f"Generated {filename}")

if __name__ == '__main__':
    generate_neutral_lut('../public/assets/neutral-lut.png')
