# 🎵 Clone Spotify App

A full-stack Spotify clone web application built with **Django** (Backend) and **React** (Frontend).  
This project demonstrates integration between a Django REST API and a modern React frontend, containerized using **Docker Compose**.

---

## 🚀 1. About the App
This is a Spotify-like clone app with features such as:
- Backend API powered by Django + Django REST Framework
- Frontend built in React with modern UI
- Realtime feature support (Chat, Now Playing - optional)
---

## 📦 2. Dockerized Setup (Frontend + Backend)
To simplify setup, this project uses **Docker Compose** to containerize both the frontend and backend.
> If you don’t have Docker Desktop installed, download it here:  
👉 [Install Docker Desktop](https://www.docker.com/get-started/)

After Docker is installed, you can run the app.
---

## 🛠️ 3. How to Run the Project

Open your terminal and run the following commands:

```bash
# Step 1: Clone the repository
git clone https://github.com/your-username/clone-spotify.git
cd clone-spotify

# Step 2: Build containers
docker-compose build

# Step 3: Start containers
docker-compose up
## If you want to run it background
docker-compose up -d


