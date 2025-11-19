# GhostData | Secure Metadata Remover

<div align="left">
    
  <!-- Dynamic Badges -->
  <a href="https://github.com/sapthesh/GhostData/stargazers">
    <img src="https://img.shields.io/github/stars/sapthesh/GhostData?style=for-the-badge&logo=github&color=b491ff&logoColor=white" alt="Stars">
  </a>
  <a href="https://github.com/sapthesh/GhostData/network/members">
    <img src="https://img.shields.io/github/forks/sapthesh/GhostData?style=for-the-badge&logo=github&color=89c4f4&logoColor=white" alt="Forks">
  </a>
  <img src="https://img.shields.io/github/repo-size/sapthesh/GhostData?style=for-the-badge&logo=github&color=ff69b4&logoColor=white" alt="Repo Size">
  <img src="https://img.shields.io/github/last-commit/sapthesh/GhostData?style=for-the-badge&logo=github&color=f4d03f&logoColor=white" alt="Last Commit">
  <a href="https://hits.sh/github.com/sapthesh/GhostData/"><img alt="Hits" src="https://hits.sh/github.com/sapthesh/GhostData.svg?style=for-the-badge"/></a>
  <a href="https://hits.sh/github.com/sapthesh/GhostData/"><img alt="Hits" src="https://hits.sh/github.com/sapthesh/GhostData.svg?view=today-total&style=for-the-badge&color=fe7d37"/></a>
</div>

---

GhostData is a secure, browser-only, offline tool designed to remove sensitive metadata (EXIF, GPS, XMP) from your photos, documents, and videos before you share them.

## 🛡️ Privacy First Philosophy

GhostData is built with a strict privacy-first architecture. 
*   **Zero Data Transfer:** All file processing happens locally within your browser using WebAssembly and JavaScript APIs.
*   **No Server Uploads:** Your files are never sent to any server, cloud, or third-party service.
*   **Offline Capable:** The application works fully offline once loaded.

## ✨ Key Features

*   **Drag & Drop Interface:** Easily upload multiple files at once.
*   **Multi-Format Support:**
    *   **Images:** JPG, JPEG, PNG, WEBP
    *   **Documents:** PDF, DOCX (Word)
    *   **Videos:** MP4, MOV
*   **Metadata Inspection:** View detailed reports of the hidden data inside your files before cleaning.
*   **Interactive GPS Maps:** Visualize exact GPS coordinates found in your files on an integrated map.
*   **Threat Analysis:** Automatic risk assessment (Safe, Low, Medium, High) based on the type of metadata detected (e.g., GPS location, device serial numbers).
*   **Batch Processing:** Remove metadata from dozens of files simultaneously.
*   **Deep Scan:** Perform intensive scans on files to uncover deeply nested or obscured metadata tags.
*   **Dark/Light Mode:** A beautiful, responsive UI that adapts to your system preference or manual toggle.

## 🚀 How It Works

1.  **Select Files:** Drag and drop your files onto the secure zone.
2.  **Analyze:** The app automatically scans efficiently for metadata headers (EXIF, XMP, etc.).
3.  **Review:** Check the "Threat Level" indicators. Click the eye icon to see specific tags or view GPS locations on a map.
4.  **Clean:** Click "Remove Metadata" to scrub the files. The app rewrites the file binary locally, stripping the metadata segments.
5.  **Download:** Save the sanitized copies back to your device.

## 🛠️ Technologies Used

*   **React:** For a dynamic and responsive user interface.
*   **TypeScript:** Ensuring type safety and robust code quality.
*   **Tailwind CSS:** For modern, clean, and dark-mode compatible styling.
*   **Lucide React:** Beautiful, consistent iconography.
*   **File Processing Libraries:**
    *   `exifreader`: For parsing robust EXIF and XMP data.
    *   `piexifjs`: For modifying JPEG binaries.
    *   `pdf-lib`: For reading and sanitizing PDF structures.
    *   `jszip`: For handling OOXML (DOCX) structures.
    *   `leaflet` & `react-leaflet`: For privacy-conscious map rendering.

## 📦 Installation & Usage

Since this is a static web application, you can run it using any static file server.

### Prerequisites
*   Node.js (for development/building) or any web server.

### Development
1.  Clone the repository.
2.  This project uses standard ES modules and can be served directly or built via a bundler (e.g., Vite).
3.  Open `index.html` in your browser (served via a local server).

### Deployment
Simply upload the project files to any static hosting provider like GitHub Pages, Vercel, or Netlify.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer:** While GhostData creates sanitized copies of files, no security tool is 100% distinct. Always verify critical files before sharing in high-risk situations.
