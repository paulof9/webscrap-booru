# 🖼️ Booru Scrapper

A simple Electron-based app for downloading images from Safebooru with real-time progress tracking and cancellation support.

## ✨ Features

- **Progress Tracking**: Visual progress bar showing download status
- **Stop process**: Stop the scraping process at any time
- **Batch Downloads**: Download multiple images based on search tags
- **Statistics**: Track downloaded and skipped files

## 🚀 Installation

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher).

### Option 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/paulof9/webscrap-booru.git

# Navigate to the project directory
cd webscrap-booru

# Install dependencies
npm install

# Start the application
npm start
```

### Option 2: Download Release

1. Go to the [Releases page](https://github.com/paulof9/webscrap-booru/releases)
2. Download the latest release for your operating system
3. Extract and run the executable

## 🎯 Usage

1. **Launch the application** using `npm start`
2. **Enter search tags** in the input field (e.g., "cat ears", "anime girl")
3. **Click "Start Scrapping"** to begin downloading
4. **Monitor progress** with the real-time progress bar
5. **Cancel anytime** using the red cancel button
6. **Find downloaded images** in the `./images` folder

## 🔧 Configuration

You can modify the following settings in `main.js`:

- `DELAY`: Time between downloads (default: 500ms)
- `locale`: Download directory (default: "./images")

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [Electron](https://electronjs.org/)
- Uses [Axios](https://axios-http.com/) for HTTP requests
- Uses [Cheerio](https://cheerio.js.org/) for HTML parsing