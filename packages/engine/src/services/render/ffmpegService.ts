import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Storyboard, RenderJobConfig, VideoFormat } from '@creatorflow/shared';

const execAsync = promisify(exec);

export interface RenderVideoOptions {
  storyboard: Storyboard;
  audioFilePath: string;
  outputFilePath: string;
  config: Partial<RenderJobConfig>;
  tempDirectory: string;
}

export interface RenderResult {
  outputFilePath: string;
  thumbnailPath: string;
  durationSec: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  renderTimeSec: number;
}

export class FfmpegRenderService {
  constructor() {}

  public async renderVideo(options: RenderVideoOptions): Promise<RenderResult> {
    const startTime = Date.now();
    const format: VideoFormat = options.config.format || options.storyboard.format || 'shorts';
    const isPortrait = format === 'shorts';
    const width = options.config.width || (isPortrait ? 1080 : 1920);
    const height = options.config.height || (isPortrait ? 1920 : 1080);
    const fps = options.config.fps || 30;

    await fs.mkdir(options.tempDirectory, { recursive: true });
    await fs.mkdir(path.dirname(options.outputFilePath), { recursive: true });

    // Step 1: Probe narration audio duration
    const totalDuration = await this.probeMediaDuration(options.audioFilePath);
    const numScenes = Math.max(1, options.storyboard.scenes.length);
    const sceneDuration = totalDuration / numScenes;

    // Step 2: Render each scene clip into a standardized video fragment
    const sceneFragments: string[] = [];
    for (let i = 0; i < numScenes; i++) {
      const scene = options.storyboard.scenes[i];
      const fragmentPath = path.join(options.tempDirectory, `frag_${i}.mp4`);
      const assetPath = scene?.selectedAsset?.localPath;

      await this.renderSceneFragment({
        assetPath,
        sceneDuration,
        width,
        height,
        fps,
        outputPath: fragmentPath,
        sceneIndex: i,
        onScreenText: scene?.onScreenText,
      });

      sceneFragments.push(fragmentPath);
    }

    // Step 3: Concatenate video fragments
    const concatListFile = path.join(options.tempDirectory, 'concat_list.txt');
    const concatFileContent = sceneFragments.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    await fs.writeFile(concatListFile, concatFileContent, 'utf-8');

    const concatenatedVideo = path.join(options.tempDirectory, 'concat_video.mp4');
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListFile}" -c copy "${concatenatedVideo}"`;
    await execAsync(concatCmd, { timeout: 60000 });

    // Step 4: Generate subtitles SRT file
    const srtFile = path.join(options.tempDirectory, 'subtitles.srt');
    await this.generateSrtSubtitles(options.storyboard, sceneDuration, srtFile);

    // Step 5: Merge video + narration audio + subtitle overlay + audio ducking
    // We escape backslashes for FFmpeg filter paths on Windows
    const safeSrtPath = srtFile.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    // Subtitle filter style with high-visibility outline and bold modern text
    const fontSize = isPortrait ? 22 : 18;
    const subFilter = options.config.burnCaptions !== false
      ? `subtitles='${safeSrtPath}':force_style='FontSize=${fontSize},FontName=Arial,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=${isPortrait ? 180 : 60}'`
      : '';

    let filterComplex = '';
    let cmd = '';

    if (subFilter) {
      filterComplex = `-vf "${subFilter}"`;
    }

    cmd = `ffmpeg -y -i "${concatenatedVideo}" -i "${options.audioFilePath}" ${filterComplex} -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -pix_fmt yuv420p "${options.outputFilePath}"`;
    
    try {
      await execAsync(cmd, { timeout: 120000 });
    } catch (err: any) {
      console.warn(`[Subtitle Burn Warning]: ${err.message}. Retrying without subtitle filter.`);
      // Fallback without subtitle filter in case libass has local path issues
      const fallbackCmd = `ffmpeg -y -i "${concatenatedVideo}" -i "${options.audioFilePath}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -shortest -pix_fmt yuv420p "${options.outputFilePath}"`;
      await execAsync(fallbackCmd, { timeout: 120000 });
    }

    // Step 6: Generate thumbnail cover frame
    const thumbnailPath = options.outputFilePath.replace(/\.mp4$/, '_thumb.jpg');
    const thumbTime = Math.min(1.5, Math.max(0.5, totalDuration / 2));
    const thumbCmd = `ffmpeg -y -ss ${thumbTime} -i "${options.outputFilePath}" -vframes 1 -q:v 2 "${thumbnailPath}"`;
    await execAsync(thumbCmd, { timeout: 20000 }).catch(() => {});

    const fileStats = await fs.stat(options.outputFilePath);
    const finalDuration = await this.probeMediaDuration(options.outputFilePath);
    const renderTimeSec = (Date.now() - startTime) / 1000;

    // Cleanup temp fragments
    await this.cleanupTemp(options.tempDirectory);

    return {
      outputFilePath: options.outputFilePath,
      thumbnailPath,
      durationSec: finalDuration,
      width,
      height,
      fileSizeBytes: fileStats.size,
      renderTimeSec: Math.round(renderTimeSec * 10) / 10,
    };
  }

  private async renderSceneFragment(opts: {
    assetPath?: string;
    sceneDuration: number;
    width: number;
    height: number;
    fps: number;
    outputPath: string;
    sceneIndex: number;
    onScreenText?: string;
  }): Promise<void> {
    // Resolve asset path: if SVG, convert to PNG sibling or fallback
    let effectiveAssetPath = opts.assetPath;
    if (effectiveAssetPath && effectiveAssetPath.endsWith('.svg')) {
      const pngSibling = effectiveAssetPath.replace(/\.svg$/, '.png');
      try {
        await fs.access(pngSibling);
        effectiveAssetPath = pngSibling;
      } catch {
        effectiveAssetPath = undefined;
      }
    }

    if (effectiveAssetPath) {
      try {
        await fs.access(effectiveAssetPath);
      } catch {
        effectiveAssetPath = undefined;
      }
    }

    const isVideo = effectiveAssetPath && (effectiveAssetPath.endsWith('.mp4') || effectiveAssetPath.endsWith('.webm'));
    const isImage = effectiveAssetPath && (
      effectiveAssetPath.endsWith('.jpg') || 
      effectiveAssetPath.endsWith('.jpeg') || 
      effectiveAssetPath.endsWith('.png') || 
      effectiveAssetPath.endsWith('.webp')
    );

    let filter = `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=increase,crop=${opts.width}:${opts.height},setsar=1`;
    // Add subtle cinematic zoom effect
    filter += `,zoompan=z='min(zoom+0.0015,1.15)':d=${Math.round(opts.sceneDuration * opts.fps)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${opts.width}x${opts.height}:fps=${opts.fps}`;

    try {
      if (isVideo && effectiveAssetPath) {
        // Loop or trim video asset to match exact scene duration
        const cmd = `ffmpeg -y -stream_loop -1 -i "${effectiveAssetPath}" -t ${opts.sceneDuration} -vf "${filter}" -c:v libx264 -preset ultrafast -r ${opts.fps} -an -pix_fmt yuv420p "${opts.outputPath}"`;
        await execAsync(cmd, { timeout: 30000 });
      } else if (isImage && effectiveAssetPath) {
        const cmd = `ffmpeg -y -loop 1 -i "${effectiveAssetPath}" -t ${opts.sceneDuration} -vf "${filter}" -c:v libx264 -preset ultrafast -r ${opts.fps} -an -pix_fmt yuv420p "${opts.outputPath}"`;
        await execAsync(cmd, { timeout: 30000 });
      } else {
        // Generate clean colored solid background with grid if no asset provided
        const colors = ['#1e293b', '#0f172a', '#172554', '#14532d', '#4c1d95'];
        const bg = colors[opts.sceneIndex % colors.length];
        const cmd = `ffmpeg -y -f lavfi -i "color=c=${bg}:s=${opts.width}x${opts.height}:r=${opts.fps}:d=${opts.sceneDuration}" -c:v libx264 -preset ultrafast -an -pix_fmt yuv420p "${opts.outputPath}"`;
        await execAsync(cmd, { timeout: 20000 });
      }
    } catch (err: any) {
      console.warn(`[FFmpeg Fragment ${opts.sceneIndex}]: ${err.message}. Generating resilient solid fallback.`);
      const colors = ['#1e293b', '#0f172a', '#172554', '#14532d', '#4c1d95'];
      const bg = colors[opts.sceneIndex % colors.length];
      const cmd = `ffmpeg -y -f lavfi -i "color=c=${bg}:s=${opts.width}x${opts.height}:r=${opts.fps}:d=${opts.sceneDuration}" -c:v libx264 -preset ultrafast -an -pix_fmt yuv420p "${opts.outputPath}"`;
      await execAsync(cmd, { timeout: 20000 });
    }
  }

  private async generateSrtSubtitles(storyboard: Storyboard, sceneDuration: number, srtPath: string): Promise<void> {
    const srtEntries: string[] = [];
    let currentTime = 0;

    for (let i = 0; i < storyboard.scenes.length; i++) {
      const scene = storyboard.scenes[i];
      const text = scene.onScreenText || scene.narrationSnippet || `Scene ${i + 1}`;
      const startTimeStr = this.formatSrtTime(currentTime);
      const endTimeStr = this.formatSrtTime(currentTime + sceneDuration - 0.2);

      srtEntries.push(`${i + 1}\n${startTimeStr} --> ${endTimeStr}\n${text}\n`);
      currentTime += sceneDuration;
    }

    await fs.writeFile(srtPath, srtEntries.join('\n'), 'utf-8');
  }

  private formatSrtTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  public async probeMediaDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
        { timeout: 10000 }
      );
      const dur = parseFloat(stdout.trim());
      return isNaN(dur) ? 10.0 : Math.round(dur * 100) / 100;
    } catch {
      return 10.0;
    }
  }

  private async cleanupTemp(tempDir: string): Promise<void> {
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.startsWith('frag_') || file.endsWith('.txt') || file.endsWith('.srt') || file.includes('concat')) {
          await fs.unlink(path.join(tempDir, file)).catch(() => {});
        }
      }
    } catch {}
  }
}
