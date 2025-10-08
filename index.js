import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const locale = "./images";

const DELAY = 500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadImage(url, filename) {
  // "arraybuffer" to download binary data (image)
    const response = await axios.get(url, { responseType: "arraybuffer" });
    // recursive: true para caso ja haja pasta continuar
  fs.mkdirSync(`${locale}`, { recursive: true });
  fs.writeFileSync(path.join(`${locale}`, filename), response.data);
  console.log(`✅: ${filename}`);
}

async function scrapImages(postUrl) {
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
}

async function search(tags) {
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
}

async function main(requestedSearch) {
  const posts = await search(requestedSearch);

  for (const post of posts) {
    const imageUrl = await scrapImages(post);
    if (imageUrl) {
      const filename = path.basename(imageUrl.split("?")[0]);
      await downloadImage(imageUrl, filename);
      await sleep(DELAY);
    }
  }

  console.log("🏁 Done.");
}

main("cat ears").catch((err) => console.error("Erro:", err));
