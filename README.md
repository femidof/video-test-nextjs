

# Video Test NextJS Project
=====================================

## Overview
-----------

This project is a NextJS application designed to manage and display videos. It features a user-friendly interface for uploading, viewing, and managing video content.


## Why I made this project
------------

Uploading attachments could be a challenge for users. This project addresses this challenge by providing a simple and user-friendly interface for uploading and displaying videos using TusVideoUploader, Bunny Stream and Bunny Storage.


## Features
------------

*   Video upload functionality using TusVideoUploader
*   Video display and playback
*   File upload and management
*   API endpoints for fetching video and file data
*   MongoDB integration for data storage
*   User-friendly interface using React and NextJS

## Getting Started
---------------

### Prerequisites

*   Node.js installed on your system
*   MongoDB installed and running on your system

### Installation

1.  Clone the repository using `git clone`
2.  Navigate to the project directory using `cd`
3.  Install dependencies using `npm install` or `yarn install`
4.  Start the development server using `npm run dev` or `yarn dev`

### API Endpoints

*   `/api/videos`: Fetches a list of videos
*   `/api/files`: Fetches a list of files
*   `/api/upload/video`: Uploads a video file
*   `/api/upload/file`: Uploads a file
*   `/api/video/status/:id`: Fetches the status of a video by ID

## Components
------------

*   `TusVideoUploader`: Handles video uploads
*   `FileUploader`: Handles file uploads
*   `VideoPlayer`: Displays and plays video content
*   `FileList`: Displays a list of files
*   `VideoList`: Displays a list of videos

## Models
---------

*   `Video`: Represents a video document in the MongoDB database
*   `File`: Represents a file document in the MongoDB database

## Utilities
------------

*   `connectDB`: Establishes a connection to the MongoDB database
*   `generateBunnyStreamAuth`: Generates authentication signature for Bunny Stream API

## Dependencies
------------

*   `next`: NextJS framework
*   `react`: React library
*   `mongodb`: MongoDB driver
*   `mongoose`: Mongoose ORM
*   `tus-js-client`: TusJS client library
*   `lucide-react`: Lucide React icons
*   `sonner`: Sonner toast notifications
*   `radix-ui`: Radix UI components

## Environment Variables
-------------------------

Create a `.env` file in the root of your project with the following variables:

```bash
MONGODB_URI=mongodb://localhost:27017/
BUNNY_STREAM_LIBRARY_ID=your-library-id
BUNNY_STREAM_API_KEY=your-api-key
BUNNY_STORAGE_API_KEY=your-api-key
BUNNY_STORAGE_ZONE_NAME=your-zone-name
```
Remember to replace `your-library-id`, `your-api-key`s, `your-zone-name` with your actual values.

## License
-------

This project is licensed under the MIT License. See `LICENSE` for details.