#!/usr/bin/env python3
import os, struct, zlib

def make_png(size, bg=(26,26,46), text_color=(124,106,255)):
    """Generate a simple PNG icon with 'N4' text using raw bytes."""
    import ctypes
    
    width = height = size
    # Create RGBA image
    img = []
    cx, cy = width // 2, height // 2
    r = min(width, height) // 2 - 2
    
    for y in range(height):
        row = []
        for x in range(width):
            # Rounded square background
            px = abs(x - cx)
            py = abs(y - cy)
            corner_r = r // 4
            in_rect = px < r and py < r
            in_corner = px > r - corner_r and py > r - corner_r
            dist = ((px - (r - corner_r))**2 + (py - (r - corner_r))**2)**0.5
            in_rounded = in_rect and (not in_corner or dist <= corner_r)
            
            if in_rounded:
                row.extend([bg[0], bg[1], bg[2], 255])
            else:
                row.extend([0, 0, 0, 0])
        img.append(row)
    
    # Draw simple "N4" by coloring pixels
    # Scale factor
    scale = size // 64
    if scale < 1: scale = 1
    
    def draw_rect(x0, y0, x1, y1, color):
        for y in range(max(0,y0), min(height,y1)):
            for x in range(max(0,x0), min(width,x1)):
                if img[y][x*4+3] > 0:
                    img[y][x*4] = color[0]
                    img[y][x*4+1] = color[1]
                    img[y][x*4+2] = color[2]
    
    s = scale * 4
    ox = cx - s * 7
    oy = cy - s * 8
    tc = text_color
    
    # N: left bar
    draw_rect(ox, oy, ox+s*2, oy+s*14, tc)
    # N: diagonal (simplified - right bar with offset)
    for i in range(14):
        x = ox + s*2 + int(i * s * 5 / 14)
        draw_rect(x, oy+i*s, x+s*2, oy+i*s+s*2, tc)
    # N: right bar
    draw_rect(ox+s*7, oy, ox+s*9, oy+s*14, tc)
    
    ox2 = cx + s * 2
    # 4: top-left bar
    draw_rect(ox2, oy, ox2+s*2, oy+s*7, tc)
    # 4: horizontal bar
    draw_rect(ox2, oy+s*7, ox2+s*9, oy+s*9, tc)
    # 4: right bar
    draw_rect(ox2+s*7, oy, ox2+s*9, oy+s*14, tc)
    
    # Convert to PNG
    raw = b''
    for row in img:
        raw += b'\x00' + bytes(row)
    
    compressed = zlib.compress(raw, 9)
    
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

os.makedirs('icons', exist_ok=True)
for size in [192, 512]:
    data = make_png(size)
    path = f'icons/icon-{size}.png'
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Created {path} ({len(data)} bytes)')
print('Icons generated!')
