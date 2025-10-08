import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const locale = "./images";
const DELAY = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadImage(url, filename) {
  try {
    // "arraybuffer" to download binary data (image)
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.mkdirSync(`${locale}`, { recursive: true });
    fs.writeFileSync(path.join(`${locale}`, filename), response.data);
    console.log(`✅: ${filename}`);
  } catch (error) {
    console.error(`Download error: ${filename}:`, error.message);
  }
}

async function scrapImages(postUrl) {
  try {
    const response = await axios.get(postUrl);
    const $ = cheerio.load(response.data);

    let img = $("#image").attr("src");
    if (!img) return null;

    // URL fix
    if (img.startsWith("//")) img = "https:" + img;
    else if (img.startsWith("/")) img = "https://safebooru.org" + img;

    // normalize slashes (remove double slashes except for the "https://")
    img = img.replace(/([^:]\/)\/+/g, "$1");

    console.log("🖼️:", img);
    return img;
  } catch (error) {
    console.error(`Process error ${postUrl}:`, error.message);
    return null;
  }
}

async function search(tags) {
  try {
    // Encode tags to handle spaces and special characters -> "cat ears" -> "cat%20ears".
    const url = `https://safebooru.org/index.php?page=post&s=list&tags=${encodeURIComponent(tags)}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const posts = [];
    $("span.thumb > a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) posts.push(`https://safebooru.org/${href}`);
    });

    return posts;
  } catch (error) {
    console.error("Search error:", error.message);
    return [];
  }
}

async function main(requestedSearch, progressCallback, cancelController) {
  try {
    console.log(`🔍 Searching: ${requestedSearch}`);
    
    // Check if cancelled before starting
    if (cancelController?.cancelled) {
      return { success: false, message: 'Operation cancelled' };
    }
    
    // starting search
    if (progressCallback) progressCallback({ type: 'searching', message: 'Searching...' });
    
    const posts = await search(requestedSearch);
    
    // Check if cancelled after search
    if (cancelController?.cancelled) {
      return { success: false, message: 'Operation cancelled' };
    }
    
    if (posts.length === 0) {
      console.log("❌ Not found.");
      if (progressCallback) progressCallback({ type: 'error', message: 'No posts found.' });
      return { success: false, message: 'No posts found.' };
    }

    console.log(`📁 Founded ${posts.length} posts`);
    
    // posts found
    if (progressCallback) {
      progressCallback({ 
        type: 'found', 
        message: `Found ${posts.length} posts`,
        total: posts.length,
        current: 0
      });
    }

    let downloaded = 0;
    let skipped = 0;

    for (let i = 0; i < posts.length; i++) {
      // Check if cancelled during loop
      if (cancelController?.cancelled) {
        const cancelMessage = `❌ Cancelled. Downloaded: ${downloaded}, Skipped: ${skipped}`;
        if (progressCallback) {
          progressCallback({ 
            type: 'cancelled', 
            message: cancelMessage,
            total: posts.length,
            downloaded,
            skipped
          });
        }
        return { success: false, message: cancelMessage };
      }
      
      const post = posts[i];
      
      // activity progress
      if (progressCallback) {
        progressCallback({ 
          type: 'progress', 
          message: `Processing ${i + 1}/${posts.length}...`,
          total: posts.length,
          current: i + 1,
          downloaded,
          skipped
        });
      }

      const imageUrl = await scrapImages(post);
      if (imageUrl) {
        const filename = path.basename(imageUrl.split("?")[0]);
        await downloadImage(imageUrl, filename);
        downloaded++;
        
        if (progressCallback) {
          progressCallback({ 
            type: 'downloaded', 
            message: `Downloaded: ${filename}`,
            total: posts.length,
            current: i + 1,
            downloaded,
            skipped,
            filename
          });
        }
      } else {
        skipped++;
      }
      
      await sleep(DELAY);
    }

    const finalMessage = `✅ Done! Downloaded: ${downloaded}, Skipped: ${skipped}`;
    console.log("🏁 " + finalMessage);
    
    if (progressCallback) {
      progressCallback({ 
        type: 'completed', 
        message: finalMessage,
        total: posts.length,
        downloaded,
        skipped
      });
    }

    return { 
      success: true, 
      message: finalMessage,
      stats: { total: posts.length, downloaded, skipped }
    };
  } catch (error) {
    console.error("Erro:", error.message);
    if (progressCallback) {
      progressCallback({ type: 'error', message: error.message });
    }
    return { success: false, message: error.message };
  }
}

export default main;
