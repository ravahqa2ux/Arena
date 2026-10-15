import zlib, struct


def load(f):
    d = open(f, 'rb').read()
    p = 8
    idat = b''
    while p < len(d):
        n, t = struct.unpack('>I4s', d[p:p + 8])
        c = d[p + 8:p + 8 + n]
        p += 12 + n
        if t == b'IHDR':
            w, h, bd, ct = struct.unpack('>IIBB', c[:10])
        if t == b'IDAT':
            idat += c
    raw = zlib.decompress(idat)
    bpp = {2: 3, 6: 4}[ct]
    s = w * bpp
    out = []
    prev = bytearray(s)
    i = 0
    for y in range(h):
        ft = raw[i]
        i += 1
        line = bytearray(raw[i:i + s])
        i += s
        if ft == 1:
            for x in range(bpp, s):
                line[x] = (line[x] + line[x - bpp]) & 255
        elif ft == 2:
            for x in range(s):
                line[x] = (line[x] + prev[x]) & 255
        elif ft == 3:
            for x in range(s):
                a = line[x - bpp] if x >= bpp else 0
                line[x] = (line[x] + (a + prev[x]) // 2) & 255
        elif ft == 4:
            for x in range(s):
                a = line[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out.append(bytes(line))
        prev = line
    return w, h, bpp, out
