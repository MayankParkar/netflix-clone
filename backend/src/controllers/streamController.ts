import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';

// Map file extensions to MIME types
// MIME type tells the browser what KIND of data it's receiving
// Without this, the browser doesn't know how to handle the bytes
// video/mp4  → browser opens its built-in video player
// video/x-matroska → MKV container format
const MIME_TYPES: Record<string, string> = {
  '.mp4':  'video/mp4',
  '.mkv':  'video/x-matroska',
  '.avi':  'video/x-msvideo',
  '.mov':  'video/quicktime',
  '.webm': 'video/webm',
};

// GET /api/v1/movies/:id/stream
export const streamVideo = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);

  if (isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid movie id' });
    return;
  }

  // ── Step 1: Look up the movie in the database ─────────────────────────────
  // We need the file path — we stored this during the HDD scan
  let movie;
  try {
    movie = await prisma.movie.findUnique({ where: { id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error' });
    return;
  }

  if (!movie) {
    res.status(404).json({ success: false, message: `Movie ${id} not found` });
    return;
  }

  const filePath = movie.filePath;

  // ── Step 2: Verify the file actually exists on the HDD ───────────────────
  // The drive might have been unplugged since the last scan
  if (!fs.existsSync(filePath)) {
    res.status(404).json({
      success: false,
      message: 'Video file not found on disk. Is the drive connected?',
      path: filePath,
    });
    return;
  }

  // ── Step 3: Get the file size ─────────────────────────────────────────────
  // fs.statSync() reads file metadata without reading the file contents
  // stats.size = total file size in bytes
  // Example: 10,737,418,240 bytes = 10GB (Lord of the Rings 4K)
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  // ── Step 4: Determine the MIME type from the file extension ───────────────
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'video/mp4';

  // ── Step 5: Read the Range header from the request ───────────────────────
  // The browser sends: "Range: bytes=0-1048576"
  // If no Range header, the browser wants the whole file (rare for video)
  const rangeHeader = req.headers.range;

  if (!rangeHeader) {
    // ── No Range header: send the entire file ────────────────────────────
    // This happens when the video URL is first opened or metadata is fetched
    // We send status 200 (not 206) because we're sending everything
    res.writeHead(200, {
      'Content-Type':   mimeType,
      'Content-Length': fileSize,
      'Accept-Ranges':  'bytes',  // tells browser: "you CAN send Range requests to me"
    });

    // Create a read stream and pipe it to the response
    // Pipe = connect two streams: read from file, write to network
    // Node.js handles the chunking automatically — memory efficient
    // Without pipe, you'd have to load the entire 10GB file into RAM
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // ── Step 6: Parse the Range header ───────────────────────────────────────
  // rangeHeader looks like: "bytes=1048576-2097152"
  // or:                     "bytes=1048576-"   (no end = "give me the rest")
  //
  // Structure: "bytes=START-END"
  // We split on '=' to get "bytes=..." then split on '-' to get [start, end]

  const parts = rangeHeader.replace(/bytes=/, '').split('-');
  // parts[0] = "1048576"  (start byte)
  // parts[1] = "2097152"  (end byte) or "" (empty = give me the rest)

  const start = parseInt(parts[0], 10);
  // parseInt("1048576", 10) = 1048576
  // The second argument '10' means "parse as base-10 number" (not hex, not binary)

  // If end is missing, calculate it:
  // We don't send the rest of the 10GB file at once — that defeats the purpose
  // Instead we send chunks of 1MB (1,048,576 bytes)
  // This keeps memory usage low and lets the browser buffer efficiently
  const CHUNK_SIZE = 1024 * 1024; // 1MB = 1,048,576 bytes

  const end = parts[1]
    ? parseInt(parts[1], 10)           // browser specified an end
    : Math.min(start + CHUNK_SIZE - 1, fileSize - 1); // we calculate end

  // Validate the range — prevent requests for bytes beyond the file
  if (start >= fileSize || end >= fileSize || start > end) {
    // 416 = Range Not Satisfiable — the requested range is invalid
    res.status(416).set({
      'Content-Range': `bytes */${fileSize}`, // tell browser the actual file size
    }).end();
    return;
  }

  // ── Step 7: Calculate how many bytes we're sending ───────────────────────
  const chunkSize = end - start + 1;
  // +1 because ranges are inclusive on both ends
  // bytes=0-0 means "send me 1 byte" (byte at position 0)
  // bytes=0-9 means "send me 10 bytes" (positions 0,1,2,3,4,5,6,7,8,9)

  // ── Step 8: Send the response headers ────────────────────────────────────
  // 206 Partial Content = "I'm sending a chunk, not the whole file"
  // This is what tells the browser's <video> element that more chunks are coming
  res.writeHead(206, {
    'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
    // Example: "bytes 0-1048575/10737418240"
    // Format:  "bytes START-END/TOTAL"

    'Accept-Ranges':  'bytes',
    // Tells browser: "yes, you can send more Range requests"

    'Content-Length': chunkSize,
    // Tells browser: "this response is exactly this many bytes"
    // Browser uses this to show the progress bar accurately

    'Content-Type':   mimeType,
    // Tells browser: "these bytes are video data"
  });

  // ── Step 9: Create a read stream for EXACTLY this byte range ─────────────
  // fs.createReadStream reads a file as a stream (chunk by chunk)
  // The { start, end } options tell Node.js which bytes to read
  // Node.js reads ONLY those bytes from disk — not the whole file
  //
  // This is the magic: seeking to position 3GB in a 10GB file is instant
  // The OS knows exactly where byte 3,000,000,000 is on disk
  // (it's at a specific sector on the physical drive platter)
  const fileStream = fs.createReadStream(filePath, { start, end });

  // ── Step 10: Pipe the stream to the response ──────────────────────────────
  // pipe() connects a readable stream (file) to a writable stream (HTTP response)
  // Data flows from file → network automatically
  // Node.js sends chunks as they're read — never loads the whole file into RAM
  // When the file stream ends, pipe() automatically closes the HTTP response
  fileStream.pipe(res);

  // ── Error handling for the file stream ───────────────────────────────────
  // File streams can fail: drive disconnected, file corrupted, permissions changed
  fileStream.on('error', (err) => {
    console.error(`[STREAM ERROR] ${err.message}`);
    // By this point headers are already sent (206 + Content headers above)
    // So we can't send a JSON error response — just destroy the connection
    res.destroy();
  });
};
